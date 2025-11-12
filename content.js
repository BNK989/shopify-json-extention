var lastProcessedTimestamp = 0;
var DEBOUNCE_TIMEOUT = 5000; // 5 seconds

// Function to duplicate the last Polaris-LegacyCard and add 'bnk' class
function duplicateLastCard() {
  const cards = document.querySelectorAll('div.Polaris-LegacyCard');
  if (cards.length === 0) return null;
  
  const lastCard = cards[cards.length - 1];
  const duplicatedCard = lastCard.cloneNode(true);
  duplicatedCard.classList.add('bnk');
  
  // Clear all children while preserving the card's structure
  const mainDiv = duplicatedCard.querySelector('div.Polaris-LegacyCard__Section');
  if (mainDiv) {
    mainDiv.innerHTML = ''; // Clear only the inner content
  } else {
    duplicatedCard.innerHTML = ''; // Fallback: clear everything if section not found
  }
  
  // Insert the duplicated card after the last card
  lastCard.parentNode.insertBefore(duplicatedCard, lastCard.nextSibling);
  
  return duplicatedCard;
}

function displayData(data, container) {
  if (!container) return;
  // If there's an error, display the error container and return
  if (data.error && data.errorDetails) {
    container.innerHTML = data.errorDetails;
    return;
  }
  // Use slidein.js to render the slide-in window
  window.renderSlidein(data, container, function() {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
}

// Function to inject a styled div showing the selected field data
function insertDataDiv(data) {
  // Commented out debug logs for production use
  // console.log('content.js: insertDataDiv called with data:', data);
  // First, remove any existing bnk cards
  const existingCard = document.querySelector('div.Polaris-LegacyCard.bnk');
  if (existingCard) {
    // console.log('content.js: removing existing bnk card');
    existingCard.remove();
  }
  
  // Create or get the container
  let card = duplicateLastCard();
  if (card) {
    // Find the main section of the card
    let container = card.querySelector('div.Polaris-LegacyCard__Section');
    if (!container) {
      // If no section exists, create one
      container = document.createElement('div');
      container.classList.add('Polaris-LegacyCard__Section');
      card.appendChild(container);
    }
    // console.log('content.js: rendering data in duplicated card container:', container);
    displayData(data, container);
  } else {
    // Fallback to floating container if card creation fails
    let container = document.getElementById('shopify-json-fields-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'shopify-json-fields-container';
      container.classList.add('bnk-floating-container');
      
      // Check stored collapse state
      chrome.storage.local.get(['bnkContainerCollapsed'], function(result) {
        if (result.bnkContainerCollapsed) {
          container.classList.add('collapsed');
        }
      });
      document.body.appendChild(container);
      // console.log('content.js: created floating container for data:', container);
    }
    displayData(data, container);
  }
}

// Function to check if the current path supports JSON endpoint
async function isJsonSupportedPath(pathname) {
  const result = await chrome.storage.sync.get(['activePageTypes']);
  const supportedPaths = result.activePageTypes || ['products', 'collections', 'pages', 'blogs', 'cart'];

  if (pathname.endsWith('delete')) {
    return false;
  }

  return supportedPaths.some(path => pathname.includes(path));
}

function extractIdFromUrl(url) {
  try {
    // Remove trailing slash if exists
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    // Split by '/' and get the last segment
    const segments = cleanUrl.split('/');
    return segments[segments.length - 1];
  } catch (error) {
    console.error('Error extracting URL segment:', error);
    return null;
  }
}

// Function to fetch JSON data from the Shopify admin page
async function getJsonData(jsonUrl, selectedFields) {
  // Check if extension is paused and get headless mode status
  const settings = await chrome.storage.sync.get(['isPaused', 'isHeadlessMode', 'getAllFields']);
  if (settings.isPaused) {
    console.log('Extension is paused, skipping JSON data fetch');
    return;
  }

  // If in admin interface, handle differently
  if (window.location.href.startsWith('https://admin.shopify')) {
    // Determine object type from URL
    const pathParts = window.location.pathname.split('/');
    let objectType = null;
    let objectKey = null;
    if (pathParts.includes('products')) {
      objectType = 'Product';
      objectKey = 'product';
    } else if (pathParts.includes('collections')) {
      objectType = 'Collection';
      objectKey = 'collection';
    } else if (pathParts.includes('pages')) {
      objectType = 'Page';
      objectKey = 'page';
    } else if (pathParts.includes('blogs')) {
      objectType = 'Blog';
      objectKey = 'blog';
    } else if (pathParts.includes('articles')) {
      objectType = 'Article';
      objectKey = 'article';
    }
    const objectId = extractIdFromUrl(window.location.href);
    if (objectId && objectType && objectKey) {
      const fieldsData = {};
      try {
        // Get user's selected fields and metafields
        const { selectedFields = [], metafields: userMetafields = [] } = await chrome.storage.sync.get(['selectedFields', 'metafields']);
        // Fetch regular fields from .json endpoint
        const jsonEndpoint = `${window.location.pathname}.json`;
        const jsonResponse = await fetch(jsonEndpoint);
        const jsonData = await jsonResponse.json();
        // Process only user-selected regular fields from JSON response
        if (jsonData[objectKey]) {
          selectedFields.forEach(field => {
            fieldsData[field] = jsonData[objectKey][field] || null;
          });
        }
        // Only fetch metafields if user has selected some
        if (userMetafields.length > 0) {
          const metafieldsEndpoint = `${window.location.pathname}/metafields.json`;
          const metafieldsResponse = await fetch(metafieldsEndpoint);
          const metafieldsData = await metafieldsResponse.json();
          if (metafieldsData.metafields) {
            // Filter and process only user-selected metafields
            metafieldsData.metafields.forEach(metafield => {
              const metafieldKey = `${metafield.namespace}.${metafield.key}`;
              if (userMetafields.includes(metafieldKey)) {
                fieldsData[metafieldKey] = metafield.value;
              }
            });
          }
        }
        if (Object.keys(fieldsData).length > 0) {
          insertDataDiv(fieldsData);
        }
      } catch (error) {
        console.warn('Error fetching admin data:', error);
      }
      return;
    }
  }

  // Allow fetching .json for storefront/custom domains as well
  if (!jsonUrl) {
    // console.log('content.js: no jsonUrl provided, aborting fetch');
    return;
  }
  // console.log('content.js: attempting JSON fetch on domain', window.location.hostname);

  try {
    // console.log('Fetching JSON data from:', jsonUrl);
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      console.error('Network error details:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
    }
    const json = await response.json();
    
    const keys = Object.keys(json);
    const fieldsData = {};
    
    // Process regular fields
    selectedFields.forEach(field => {
      let value = "null";
      for (const key of keys) {
        if (json[key]?.[field] != undefined) {
          value = json[key][field];
        }
      }
      fieldsData[field] = value;
      if (value === "null") {
        // console.log(`content.js: field '${field}' not found in JSON response`);
      } else {
        // console.log(`content.js: extracted '${field}':`, value);
      }
    });

    // Extract object type and ID
    let objectType = 'Product';
    let objectId = null;

    if (json.product?.id) {
      objectType = 'Product';
      objectId = json.product.id;
    } else if (json.collection?.id) {
      objectType = 'Collection';
      objectId = json.collection.id;
    } else if (json.page?.id) {
      objectType = 'Page';
      objectId = json.page.id;
    } else if (json.blog?.id) {
      objectType = 'Blog';
      objectId = json.blog.id;
    } else if (json.article?.id) {
      objectType = 'Article';
      objectId = json.article.id;
    }

    if (objectId) {
      try {
        const result = await chrome.storage.sync.get(['metafields']);
        const userMetafields = result.metafields || [];
        
        if (typeof window.getMetafieldData === 'function') {
          const metafieldData = await window.getMetafieldData(objectId, userMetafields, objectType);
          if (metafieldData && !metafieldData.error) {
            Object.assign(fieldsData, metafieldData);
          } else if (metafieldData?.error) {
            // console.log('Metafield data error:', metafieldData.error);
            fieldsData.error = metafieldData.error;
            fieldsData.errorDetails = `Error fetching metafields: ${metafieldData.error}`;
          }
        } else {
          // console.log('getMetafieldData function is not yet available');
        }
      } catch (error) {
        console.warn('Error fetching metafield data:', error);
      }
    }

    if (!Object.values(fieldsData).every(value => value === "null")) {
      insertDataDiv(fieldsData);
    }
  } catch (error) {
    console.log('Error fetching JSON data:', error);
  }
}

// Function to check if the current domain matches any saved domains
function isDomainAllowed(currentDomain) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['domains'], function(result) {
      const domains = result.domains || [];
      // console.log('Checking domain:', currentDomain);
      // console.log('Against saved domains:', domains);
      
      // Check if current domain matches any saved domain
      const isAllowed = domains.some(domain => {
        // Convert both to lowercase and trim for comparison
        const savedDomain = domain.toLowerCase().trim();
        const current = currentDomain.toLowerCase().trim();
        // Check if domain matches exactly or is a subdomain
        const matches = current === savedDomain || current.endsWith('.' + savedDomain);
        if (matches) {
          // console.log('Domain match found:', savedDomain);
        }
        return matches;
      });
      
      const finalResult = isAllowed || currentDomain.includes('myshopify.com') || currentDomain.includes('admin.shopify.com');
      // console.log('Domain is allowed:', finalResult);
      resolve(finalResult);
    });
  });
}

// Retrieve the user-selected fields from storage and fetch the JSON data
async function updateContent() {
  // Get current domain from window location
  const currentDomain = window.location.hostname;
  
  // Always allow if in Shopify admin
  if (window.location.href.startsWith('https://admin.shopify')) {
    // console.log('content.js: Shopify admin detected, bypassing domain checks');
  } else {
    // Check if this domain is allowed
    const isAllowed = await isDomainAllowed(currentDomain);
    if (!isAllowed) {
      return; // Exit if domain is not in the allowed list
    }
  }

  const currentUrl = new URL(window.location.href);
  
  // Check if the current path supports JSON endpoints
  const isSupportedPath = await isJsonSupportedPath(currentUrl.pathname);
  if (!isSupportedPath) {
    // console.log('Current path does not support JSON endpoints', currentUrl.pathname );
    return;
  }

  // Check if the page type is in activePageTypes
  const result = await chrome.storage.sync.get(['activePageTypes', 'selectedFields']);
  const activePageTypes = result.activePageTypes || [];
  const selectedFields = result.selectedFields || [];

  if (selectedFields.length === 0) {
    return;
  }

  // Special handling for non-Shopify sites
  // Special handling for non-Shopify sites:
  // - If isHeadlessMode is true, prefer metafield/storefront API flow (if available)
  // - If isHeadlessMode is false, fall through and fetch the .json endpoint (same URL + .json)
  const headlessResult = await chrome.storage.sync.get(['isHeadlessMode']);
  const isHeadlessMode = headlessResult.isHeadlessMode || false;
  if (!currentDomain.includes('shopify.com')) {
    // console.log('content.js: storefront/custom domain detected:', currentDomain, 'isHeadlessMode=', isHeadlessMode);
    if (isHeadlessMode) {
      // Try to use getMetafieldData (headless flow) if productId exists
      const productId = extractIdFromUrl(window.location.href);
      if (productId) {
        try {
          const result = await chrome.storage.sync.get(['metafields']);
          const userMetafields = result.metafields || [];
          const metafieldData = (typeof window.getMetafieldData === 'function') ?
            await window.getMetafieldData(productId, userMetafields, 'Product') : null;
          if (metafieldData && !metafieldData.error) {
            insertDataDiv(metafieldData);
            return;
          }
        } catch (error) {
          console.warn('Error fetching metafield data (headless):', error);
        }
      }
      // If headless mode failed or getMetafieldData not available, fall through to try .json as a fallback
      // console.log('content.js: headless flow did not return data, will try .json fallback');
    } else {
      // Not headless: proceed to attempt .json fetch below
      // console.log('content.js: not headless - will attempt .json fetch for storefront domain');
    }
  }

  // For Shopify sites, continue with normal flow
  const currentPathArr = currentUrl.pathname.split('/');
  const pageType = currentPathArr[currentPathArr.length - 2] || currentPathArr[currentPathArr.length - 1];

  if (!activePageTypes.includes(pageType)) {
    console.log(`Page type '${pageType}' is not in activePageTypes. Skipping update.`);
    return;
  }

  // If the current URL is not already a JSON endpoint, append ".json" to the pathname.
  if (!currentUrl.pathname.endsWith('.json')) {
    currentUrl.pathname += '.json';
  }
  const jsonUrl = currentUrl.href;

  // Fetch the JSON data and display the selected fields
  getJsonData(jsonUrl, selectedFields);
}

// Function to check if we're in Shopify admin
function isShopifyAdmin() {
  const hostname = window.location.hostname;
  return hostname.includes('myshopify.com') || hostname.includes('admin.shopify.com');
}

// Function to check if Shopify admin interface is ready
function isShopifyAdminReady() {
  // Check for common Shopify admin elements
  const hasPolarisElements = document.querySelector('.Polaris-LegacyCard') !== null;
  const hasNavigation = document.querySelector('.Polaris-Navigation') !== null;
  return hasPolarisElements && hasNavigation;
}

// Function to wait for Shopify admin interface to be ready
function waitForShopifyAdmin() {
  return new Promise((resolve) => {
    if (isShopifyAdminReady()) {
      resolve();
    } else {
      const observer = new MutationObserver((mutations, obs) => {
        if (isShopifyAdminReady()) {
          obs.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Set a timeout to prevent infinite waiting
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 10000); // 10 second timeout
    }
  });
}


// Message listener in content.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Handle PING message
  if (request.type === 'PING') {
    sendResponse({ type: 'PONG' });
    return true; // Indicate async response
  }
  
  if (request.action === "updateContent") {
    // Check pause state first
    chrome.storage.sync.get(['isPaused'], function(result) {
      if (result.isPaused) {
        console.log('Extension is paused, ignoring updateContent request.');
        return; // Don't proceed if paused
      }

      // console.log("Update content requested from:", request.source || "unknown");
      
      // Implement debouncing - only process if enough time has passed since last update
      const now = Date.now();
      if (request.source && now - lastProcessedTimestamp < DEBOUNCE_TIMEOUT) {
        // console.log("Debouncing update request, last update was", (now - lastProcessedTimestamp)/1000, "seconds ago");
        return;
      }
      
      // Update the timestamp
      lastProcessedTimestamp = now;
      
      // Clear the previous container if it exists
      const container = document.getElementById('shopify-json-fields-container');
      if (container) {
        console.log('Container already exists, skipping update.'); // Added log for clarity
        return;
      }
      
      // Process the update
      updateContent();
    });
    return true; // Indicate async response
  }
  return false; // Indicate sync response for other messages
});

// Function to initialize the extension
// Replace the global variable declaration
if (!window.hasOwnProperty('bnkExtensionInitialized')) {
  window.bnkExtensionInitialized = false;
  lastProcessedTimestamp = 0;
  var DEBOUNCE_TIMEOUT = 5000; // 5 seconds - Ensure var is used if not already declared in this scope

  async function initializeExtension() {
    // Check pause state first
    const settings = await new Promise(resolve => chrome.storage.sync.get(['isPaused'], resolve));
    if (settings.isPaused) {
      console.log('Extension is paused, skipping initialization.');
      return; // Don't initialize if paused
    }

    if (window.bnkExtensionInitialized) {
      console.log('Extension already initialized');
      return;
    }
    
    try {
      const now = Date.now();
      if (now - lastProcessedTimestamp < DEBOUNCE_TIMEOUT) {
        console.log("Debouncing initialization, last update was", (now - lastProcessedTimestamp)/1000, "seconds ago");
        return;
      }
      
      lastProcessedTimestamp = now;
      
      if (isShopifyAdmin()) {
        await waitForShopifyAdmin();
      }

      await updateContent();
      
      window.bnkExtensionInitialized = true;
    } catch (error) {
      console.error('Error initializing extension:', error);
    }
  }

  // Initialize only if not already initialized
  if (!window.bnkExtensionInitialized) {
    initializeExtension();
  }
}

// In background.js, handle the openPopup message
// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//   if (msg.action === 'openPopup') {
//     chrome.windows.create({
//       url: chrome.runtime.getURL('popup.html'),
//       type: 'popup',
//       width: 400,
//       height: 600
//     });
//   }
// });
