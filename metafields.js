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
 * @returns {string}
 */

function createQuery(productId, metafields) {
  const productGid = `gid://shopify/Product/${productId}`;
  
  const metafieldQueries = metafields.map((field, index) => {
    const [namespace, key] = field.split(".");
    const alias = key.replace(/[^a-zA-Z0-9]/g, ""); // Clean alias name
    return `${alias}: metafield(namespace: "${namespace}", key: "${key}") {\n      value\n    }`;
  }).join("\n    ");

  return `query GetProductBumpDate {
  product(id: "${productGid}") {
    ${metafieldQueries}
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

  if (!STOREFRONT_ACCESS_TOKEN) {
     console.error('Storefront Access Token is missing.');
     // Consider a less disruptive error than alert in production
     alert('Storefront Access Token not configured!');
     return null;
  }

  const query = createQuery(id, metafieldRequests);
  // console.log("Generated Query:", query); // Good for debugging

  try {
    const response = await fetch(storefrontApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN, // No need for template literal `${}` here
      },
      // ***** FIX 1: Correct body format *****
      body: JSON.stringify({ query }),
    });

    // ... (response.ok check remains the same) ...
    if (!response.ok) {
      let errorBody = 'Could not read error body';
      try {
        errorBody = await response.text();
      } catch (_) {}
      console.error(`GraphQL request failed: ${response.status} ${response.statusText}`, errorBody);
      return null;
    }


    const jsonResponse = await response.json();
    // console.log("Raw JSON Response:", jsonResponse); // Good for debugging

    // Check for GraphQL errors within the response
    if (jsonResponse.errors) {
        console.error('GraphQL errors:', jsonResponse.errors);
        // Often helpful to return the errors array or an object indicating failure type
        return { error: 'GraphQL Error', details: jsonResponse.errors };
    }

    const productData = jsonResponse.data?.product;
    const results = {};

    if (productData) {
      // ***** FIX 2: Correct data retrieval using aliases *****
      metafieldRequests.forEach((req) => { // No need for index 'i' here
        const [namespace, key] = req.split(".");
        const alias = key.replace(/[^a-zA-Z0-9]/g, ""); // Regenerate the alias
        const value = productData[alias]?.value;     // Access using the alias
        results[key] = value !== undefined ? value : null; // Store using the key, handle undefined explicitly
      });
      console.log('Processed results:', results);
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