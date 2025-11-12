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
  // Commented out debug logs for production use
  // console.log('content.js: displayData called with data:', data, 'container:', container);
  if (!container) return;
  
  // Clear the container's content
  container.innerHTML = '';
  
  // If there's an error, display the error container and return
  if (data.error && data.errorDetails) {
    container.innerHTML = data.errorDetails;
    return;
  }
  
  // Create header with close button
  const header = document.createElement('div');
  header.classList.add('bnk-header');
  
  // Add collapse button if it's a floating container
  if (container.classList.contains('bnk-floating-container')) {
    const collapseBtn = document.createElement('button');
    collapseBtn.classList.add('bnk-collapse-btn');
    collapseBtn.innerHTML = '<svg viewBox="0 0 20 20"><path d="M12.4 4.6L8 9l4.4 4.4c.6.6.6 1.5 0 2.1-.6.6-1.5.6-2.1 0l-5.5-5.5c-.6-.6-.6-1.5 0-2.1L10.3 2.5c.6-.6 1.5-.6 2.1 0 .6.6.6 1.6 0 2.1z"/></svg>';
    collapseBtn.onclick = () => {
      const isCollapsed = container.classList.toggle('collapsed');
      chrome.storage.local.set({ 'bnkContainerCollapsed': isCollapsed });
    };
    container.appendChild(collapseBtn);
  }
  
  const h3 = document.createElement('h3');
  h3.textContent = 'Additional Shopify Fields';
  h3.classList.add('Polaris-Text--root', 'Polaris-Text--headingSm', 'bnk-title');
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '×';
  closeButton.title = 'Close';
  closeButton.classList.add('bnk-close-button');
  closeButton.onclick = () => {
    const card = container.closest('.Polaris-LegacyCard.bnk');
    if (card) {
      card.remove();
    } else {
      container.classList.add('removing')
      setTimeout(()=> {
        container.remove();
      }, 900)
    }
  };
  
  header.appendChild(h3);
  container.appendChild(header);
  
  const ul = document.createElement('ul');
  ul.classList.add('bnk-container');

  // Separate metafields and non-metafields
  const regularFields = ['id', 'title', 'handle', 'createdAt', 'updatedAt'];
  const entries = Object.entries(data);
  
  // First add non-metafield properties
  entries
    .filter(([key]) => regularFields.includes(key))
    .forEach(([key, value]) => {
      if (!value || value === 'null') return;
      const li = document.createElement('li');
      
      let displayValue = value;
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        displayValue = `${window.bnkUtils.formatDate(value)} (${window.bnkUtils.getDaysElapsed(value)})`;
      } 
      
      li.innerHTML = `<span class="bnk-field-key">${key}:</span> ${displayValue}`;
      li.title = 'Click to copy';
      li.onclick = () => {
        navigator.clipboard.writeText(value).then(() => {
          const originalText = li.innerHTML;
          li.innerHTML = `${originalText} <span class='copy-confirm'>✔ Copied</span>`;
          setTimeout(() => {
            li.querySelector('.copy-confirm').remove();
          }, 1500);
        }).catch(err => console.error('Failed to copy:', err));
      };
      ul.appendChild(li);
    });

  // Then add metafield properties
  entries
    .filter(([key]) => !regularFields.includes(key))
    .forEach(([key, value]) => {
      if (!value || value === 'null') return;
      const li = document.createElement('li');
      
      let displayValue = value;
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        displayValue = `${window.bnkUtils.formatDate(value)} (${window.bnkUtils.getDaysElapsed(value)})`;
      } 
      
      li.innerHTML = `<span class="bnk-field-key">${key}:</span> ${displayValue}`;
      li.title = 'Click to copy';
      li.onclick = () => {
        navigator.clipboard.writeText(value).then(() => {
          const originalText = li.innerHTML;
          li.innerHTML = `${originalText} <span class='copy-confirm'>✔ Copied</span>`;
          setTimeout(() => {
            li.querySelector('.copy-confirm').remove();
          }, 1500);
        }).catch(err => console.error('Failed to copy:', err));
      };
      ul.appendChild(li);
    });
  
  container.appendChild(ul);
  
  // Add "View Full JSON" button
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('bnk-button-container');
  
  const jsonButton = document.createElement('a');
  const isJsonPage = window.location.pathname.endsWith('.json');
  const targetPath = isJsonPage 
    ? window.location.pathname.slice(0, -5) // Remove '.json'
    : window.location.pathname + '.json';
  
  jsonButton.href = targetPath;
  jsonButton.classList.add('Polaris-Button', 'Polaris-Button--primary');
  jsonButton.innerHTML = `
    <span class="Polaris-Button__Content">
      <span class="Polaris-Button__Icon" title="${isJsonPage ? 'View Page' : 'View JSON'}">${
        isJsonPage 
          ? '<svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 466 511.963" style= "height: 12px;" ><path d="M76.065 104.048c14.039 10.427 28.933 21.173 36.759 25.607 19.558 11.169 22.836 38.57 14.408 39.74-3.338.464-14.432-5.327-27.253-12.986-29.561-17.661-74.927-47.317-93.527-76.33C2.224 73.483-.346 66.995.038 61.192c.293-4.445 2.788-7.708 8.265-9.366C47.897 36.613 82.725 19.974 111.131 1.415c2.42-1.346 4.619-1.695 6.631-1.203 6.712 1.64 12.585 15.647 14.456 21.588 2.694 8.553 1.685 13.59-5.18 18.338-13.515 9.346-28.999 16.228-44.546 22.911 111.908 7.207 204.019 54.796 269.926 126.745 72.915 79.599 113.669 188.977 113.581 306.364-.004 6.723-.577 10.496-4.081 13.312-3.164 2.542-7.141 2.712-14.118 2.348-10.814-.563-16.828-2.623-20.808-9.195-3.403-5.62-4.254-13.817-5.081-27.422-.244-4.013-.617-8.023-.884-12.037-6.55-98.572-45.366-189.537-110.1-255.329-58.576-59.533-138.435-98.473-234.862-103.787z"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-1.5 0a1.5 1.5 0 1 1-3.001-.001 1.5 1.5 0 0 1 3.001.001"></path><path fill-rule="evenodd" d="M8 2c-2.476 0-4.348 1.23-5.577 2.532a9.3 9.3 0 0 0-1.4 1.922 6 6 0 0 0-.37.818c-.082.227-.153.488-.153.728s.071.501.152.728c.088.246.213.524.371.818.317.587.784 1.27 1.4 1.922 1.229 1.302 3.1 2.532 5.577 2.532s4.348-1.23 5.577-2.532a9.3 9.3 0 0 0 1.4-1.922c.158-.294.283-.572.37-.818.082-.227.153-.488.153-.728s-.071-.501-.152-.728a6 6 0 0 0-.371-.818 9.3 9.3 0 0 0-1.4-1.922c-1.229-1.302-3.1-2.532-5.577-2.532m-5.999 6.002v-.004c.004-.02.017-.09.064-.223.058-.161.15-.369.278-.608a7.8 7.8 0 0 1 1.17-1.605c1.042-1.104 2.545-2.062 4.487-2.062s3.445.958 4.486 2.062c.52.55.912 1.126 1.17 1.605.13.24.221.447.279.608.047.132.06.203.064.223v.004c-.004.02-.017.09-.064.223-.058.161-.15.369-.278.608a7.8 7.8 0 0 1-1.17 1.605c-1.042 1.104-2.545 2.062-4.487 2.062s-3.445-.958-4.486-2.062a7.7 7.7 0 0 1-1.17-1.605 4.5 4.5 0 0 1-.279-.608c-.047-.132-.06-.203-.064-.223"></path></svg>'
      }
       
      </span>
    </span>
  `;
  
  buttonContainer.appendChild(jsonButton);

  header.appendChild(buttonContainer);
  header.appendChild(closeButton);
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
