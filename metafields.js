// --- Configuration ---
let SHOPIFY_STORE_DOMAIN = '';
let STOREFRONT_ACCESS_TOKEN = '';
const SHOPIFY_API_VERSION = '2024-04'; // Use a recent, supported API version

let storefrontApiUrl = '';

// Load configuration from chrome.storage
chrome.storage.sync.get(['shopifyDomain', 'storefrontToken'], function(result) {
  SHOPIFY_STORE_DOMAIN = result.shopifyDomain || '';
  STOREFRONT_ACCESS_TOKEN = result.storefrontToken || '';
  storefrontApiUrl = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
});
// --- End Configuration ---  

/** 
 * @param {int} id The id of the product (e.g., 7968708558908).
 * @param {string[]} metafields An array of strings in the format "namespace.key".
 * @param {Object} options Additional options for query generation.
 * @param {boolean} options.getAllFields Whether to include all selected fields.
 * @param {string[]} options.selectedFields Array of regular field names to include.
 * @returns {string}
*/
function createQuery(productId, metafields, options = {}) {
  const productGid = `gid://shopify/Product/${productId}`;
  const { getAllFields = false, selectedFields = [] } = options;
  
  const metafieldQueries = metafields.map((field) => {
    const [namespace, key] = field.split(".");
    const alias = key.replace(/[^a-zA-Z0-9]/g, ""); // Clean alias name
    return `${alias}: metafield(namespace: "${namespace}", key: "${key}") {
      value
    }`;
  }).join("\n    ");

  const regularFields = getAllFields && selectedFields.length > 0
    ? selectedFields.join("\n    ")
    : "";

  const allFields = [
    regularFields,
    metafieldQueries
  ].filter(Boolean).join("\n    ");

  return `query GetProductBumpDate {
  product(id: "${productGid}") {
    ${allFields}
  }
}`;
}

/** 
 * @param {int} id The id of the product (e.g., 7968708888908).
 * @param {string[]} metafields An array of strings in the format "namespace.key".
 * @returns {Promise<string>}
 */
window.getMetafieldData = async function(id, metafieldRequests) {
  if (!id) {
    console.error('Product id is required.');
    return null;
  }

  // Get the getAllFields setting and selectedFields from storage first
  const { getAllFields = false, selectedFields = [] } = await new Promise(resolve => {
    chrome.storage.sync.get(['getAllFields', 'selectedFields'], result => resolve(result));
  });

  if (!getAllFields && (!metafieldRequests || metafieldRequests.length === 0)) {
    return null;
  }

  if (!STOREFRONT_ACCESS_TOKEN) {
     console.error('Storefront Access Token is missing.');
     // Consider a less disruptive error than alert in production
     alert('Storefront Access Token not configured!');
     return null;
  }

  const query = createQuery(id, metafieldRequests, { getAllFields, selectedFields });
  console.log("Generated Query:", query); // Good for debugging

  try {
    const response = await fetch(storefrontApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN, // No need for template literal `${}` here
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      let errorBody = 'Could not read error body';
      try {
        errorBody = await response.text();
      } catch (_) {}
      console.error(`GraphQL request failed: ${response.status} ${response.statusText}`, errorBody);
      return null;
    }


    const jsonResponse = await response.json();
    console.log("Raw JSON Response:", jsonResponse);

    // Check for GraphQL errors within the response
    if (jsonResponse.errors) {
        console.error('GraphQL errors:', jsonResponse.errors);
        // Often helpful to return the errors array or an object indicating failure type
        return { error: 'GraphQL Error', details: jsonResponse.errors };
    }

    const productData = jsonResponse.data?.product;
    const results = {};

    if (productData) {
      // Process metafields
      metafieldRequests.forEach((req) => { 
        const [namespace, key] = req.split(".");
        const alias = key.replace(/[^a-zA-Z0-9]/g, ""); // Regenerate the alias
        const value = productData[alias]?.value;     // Access using the alias
        results[key] = value !== undefined ? value : null; // Store using the key, handle undefined explicitly
      });

      // Add selected fields if getAllFields is true
      if (getAllFields && selectedFields.length > 0) {
        selectedFields.forEach(field => {
          results[field] = productData[field] || null;
        });
      }
      return results;
    }

    // Handle product not found specifically if productData is null but no GraphQL errors occurred
    if (jsonResponse.data && !jsonResponse.data.product) {
        console.log(`Product not found for ID: ${id}`);
        return { error: 'Product Not Found' }; // Or return null, depending on desired behavior
    }

    // Fallback if data structure is unexpected
    console.log(`Unexpected response structure. Product data not found for ID: gid://shopify/Product/${id}`);
    return null;


  } catch (error) {
    // Network errors handling
    console.error('Error fetching metafield:', error.toString());
    
    // More specific error checking
    if (error instanceof TypeError && error.message && error.message.toLowerCase().includes('fetch')) {
      console.error("Network or CORS issue detected");
    }
    return null;
  }
}