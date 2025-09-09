// --- Configuration ---
let SHOPIFY_STORE_DOMAIN = '';
let STOREFRONT_ACCESS_TOKEN = '';
const SHOPIFY_API_VERSION = '2025-04'; // Use a recent, supported API version

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
function createQuery(itemId, metafields, options = {}) {
  const { getAllFields = false, selectedFields = [], objectType = 'Product' } = options;
  const validTypes = ['Product', 'Collection', 'Page', 'Blog', 'Article'];
  const type = validTypes.includes(objectType) ? objectType : 'Product';
  const gid = `gid://shopify/${type}/${itemId}`;
  
  const metafieldQueries = metafields.map((field) => {
    const [namespace, key] = field.split(".");
    const alias = key.replace(/[^a-zA-Z0-9]/g, ""); // Clean alias name
    return `${alias}: metafield(namespace: "${namespace}", key: "${key}") {
      value
    }`;
  }).join("\n    ");

  // Only include regular fields if getAllFields is true
  let regularFields = '';
  if (getAllFields) {
    const defaultFields = ['id', 'title', 'handle', 'createdAt', 'updatedAt'];
    const camelCaseFields = selectedFields.map(field => field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()));
    const uniqueFields = [...new Set([...defaultFields, ...camelCaseFields])];
    regularFields = uniqueFields.join('\n    ');
  }

  // Combine regular fields and metafield queries
  const allFields = [
    regularFields,
    metafieldQueries
  ].filter(Boolean).join('\n    ');

  const queryType = type.toLowerCase();
  return `query Get${type}Fields {
  ${queryType}(id: "${gid}") {
    ${allFields}
  }
}`;
}

/** 
 * @param {int} id The id of the product (e.g., 7968708888908).
 * @param {string[]} metafields An array of strings in the format "namespace.key".
 * @returns {Promise<string>}
 */
window.getMetafieldData = async function(id, metafieldRequests, objectType = 'Product') {
  if (!id) {
    console.warn('Object id is required.');
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
     console.warn('Storefront Access Token is missing.');
     alert('Storefront Access Token not configured!');
     return null;
  }

  const query = createQuery(id, metafieldRequests, { getAllFields, selectedFields, objectType });
  // console.log("Generated Query:", query);

  const requestBody = { query };
  // console.log("Request Body:", requestBody);

  try {
    const response = await fetch(storefrontApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorBody = 'Could not read error body';
      try {
        errorBody = await response.text();
      } catch (_) {}
      console.warn(`GraphQL request failed: ${response.status} ${response.statusText}`, errorBody);
      return null;
    }

    const jsonResponse = await response.json();
    // console.log("Raw JSON Response:", jsonResponse);

    if (jsonResponse.errors) {
        console.warn('GraphQL errors:', jsonResponse.errors);
        return { error: 'GraphQL Error', details: jsonResponse.errors };
    }

    const queryType = objectType.toLowerCase();
    const objectData = jsonResponse.data?.[queryType];
    const results = {};
    const fieldsArr = []

    if (objectData) {
      // Process metafields
      if(getAllFields){
        fieldsArr.push(...metafieldRequests, ...selectedFields)
      } else {
        fieldsArr.push(...metafieldRequests)
      }
      // console.log('objectData:', objectData)
      fieldsArr.forEach((req) => { 
        // console.log('req:', req)
        if (req.includes('.')) {
          const [namespace, key] = req.split(".");
          const alias = key.replace(/[^a-zA-Z0-9]/g, "");
          const value = objectData[alias]?.value;
          results[key] = value !== undefined ? value : null;
        } else {
          const camelCaseField = window.bnkUtils.snakeToCamel(req);
          results[camelCaseField] = objectData[camelCaseField] || null;
          results[req] = objectData[req] || null;
        }
      });

      // Add selected fields if getAllFields is true
      if (getAllFields && selectedFields.length > 0) {
        selectedFields.forEach(field => {
          let fieldValue = objectData[field];
          // Extract numeric ID from gid URL if the field is an ID
          if (field === 'id' && typeof fieldValue === 'string' && fieldValue.startsWith('gid://')) {
            fieldValue = fieldValue.split('/').pop();
          }
          results[field] = fieldValue || null;
        });
      }
      // console.log("Processed Results:", results);
      return results;
    }

    // Handle object not found
    if (jsonResponse.data && (!objectData || Object.keys(objectData).length === 0)) {
        const gid = `gid://shopify/${objectType}/${id}`;
        console.log(`${objectType} not found for ID: ${id}`);
        console.log(`Full GID: ${gid}`);
        console.log(`Store domain: ${SHOPIFY_STORE_DOMAIN}`);
        console.log(`API version: ${SHOPIFY_API_VERSION}`);
        console.log(`Request URL: ${storefrontApiUrl}`);
        console.log(`Requested fields: ${JSON.stringify(metafieldRequests)}`);
        console.log(`getAllFields setting: ${getAllFields}`);
        console.log(`Current page URL: ${window.location.href}`);
        return { error: `${objectType} Not Found`, details: {
            id,
            gid,
            storeDomain: SHOPIFY_STORE_DOMAIN,
            apiVersion: SHOPIFY_API_VERSION,
            requestUrl: storefrontApiUrl,
            pageUrl: window.location.href
        }};
    }

    const gid = `gid://shopify/${objectType}/${id}`;
    console.warn(`Unexpected response structure. ${objectType} data not found for ID: ${gid}`);
    console.warn(`Store domain: ${SHOPIFY_STORE_DOMAIN}`);
    console.warn(`API version: ${SHOPIFY_API_VERSION}`);
    console.warn(`Request URL: ${storefrontApiUrl}`);
    console.warn(`Response structure:`, JSON.stringify(jsonResponse, null, 2));
    console.warn(`Current page URL: ${window.location.href}`);
    return { error: `Unexpected Response Structure`, details: {
        id,
        gid,
        storeDomain: SHOPIFY_STORE_DOMAIN,
        apiVersion: SHOPIFY_API_VERSION,
        requestUrl: storefrontApiUrl,
        responseStructure: jsonResponse,
        pageUrl: window.location.href
    }};

  } catch (error) {
    const gid = `gid://shopify/${objectType}/${id}`;
    console.warn('Error fetching metafield:', error.toString());
    console.warn(`Object type: ${objectType}, ID: ${id}`);
    console.warn(`Full GID: ${gid}`);
    console.warn(`Store domain: ${SHOPIFY_STORE_DOMAIN}`);
    console.warn(`API version: ${SHOPIFY_API_VERSION}`);
    console.warn(`Request URL: ${storefrontApiUrl}`);
    console.warn(`Current page URL: ${window.location.href}`);
    
    let errorType = 'Unknown Error';
    if (error instanceof TypeError && error.message && error.message.toLowerCase().includes('fetch')) {
      errorType = 'Network or CORS Issue';
      console.warn("Network or CORS issue detected");
    } else if (error.name === 'SyntaxError') {
      errorType = 'JSON Parsing Error';
      console.warn("Invalid JSON response");
    }
    
    return { error: errorType, details: {
      id,
      gid,
      storeDomain: SHOPIFY_STORE_DOMAIN,
      apiVersion: SHOPIFY_API_VERSION,
      requestUrl: storefrontApiUrl,
      errorMessage: error.toString(),
      pageUrl: window.location.href
    }};
  }
}