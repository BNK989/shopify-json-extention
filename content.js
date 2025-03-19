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

function insertDataToDiv(data, container) {
  if (!container) return;
  
  // Clear the container's content
  container.innerHTML = '';
  
  // Create header with close button
  const header = document.createElement('div');
  header.classList.add('bnk-header');
  
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
      container.remove();
    }
  };
  
  header.appendChild(h3);
  // header.appendChild(closeButton); // moved to button 
  container.appendChild(header);
  
  const ul = document.createElement('ul');
  ul.classList.add('bnk-container');

  for (const [key, value] of Object.entries(data)) {
    if (value === "N/A") continue;
    const li = document.createElement('li');
    
    let displayValue = value;
    if (key.toLowerCase().includes('_at')) {
      displayValue = `${window.bnkUtils.formatDate(value)} (${window.bnkUtils.getDaysElapsed(value)})`;
    } 
    
    li.innerHTML = `<span class="bnk-field-key">${key}:</span> ${displayValue}`;
    ul.appendChild(li);
  }
  
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
  // jsonButton.target = '_blank';
  jsonButton.classList.add('Polaris-Button', 'Polaris-Button--primary');
  jsonButton.innerHTML = `
    <span class="Polaris-Button__Content">
      <span class="Polaris-Button__Icon" title="${isJsonPage ? 'View Page' : 'View JSON'}">${isJsonPage 
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
  // First, remove any existing bnk cards
  const existingCard = document.querySelector('div.Polaris-LegacyCard.bnk');
  if (existingCard) {
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
    insertDataToDiv(data, container);
  } else {
    // Fallback to floating container if card creation fails
    let container = document.getElementById('shopify-json-fields-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'shopify-json-fields-container';
      container.classList.add('bnk-floating-container');
      document.body.appendChild(container);
    }
    insertDataToDiv(data, container);
  }
}

// Function to check if the current path supports JSON endpoint
function isJsonSupportedPath(pathname) {
  const supportedPaths = [
    '/products/',
    '/collections/',
    '/pages/',
    '/blogs/',
    '/articles/',
    '/cart'
  ];
  return supportedPaths.some(path => pathname.includes(path));
}

// Function to fetch JSON data from the Shopify admin page
function getJsonData(jsonUrl, selectedFields) {
  fetch(jsonUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(json => {
      // Log the full JSON response for debugging purposes.
      // console.log('Fetched JSON:', json);
      const keys = Object.keys(json)

      const fieldsData = {};
      selectedFields.forEach(field => {
        let value = "N/A"
        for (const key of keys) {
          if (json[key]?.[field] != undefined) {
            value = json[key][field]
          }
        }
        fieldsData[field] = value;
      });

      // Check if all values in fieldsData are "N/A"
      const allValuesNA = Object.values(fieldsData).every(value => value === "N/A");

      if (!allValuesNA) {
        insertDataDiv(fieldsData);
      } 
    })
    .catch(error => {
      console.warn('Error fetching JSON data:', error);
      // Create a card with error message for supported paths
      if (isJsonSupportedPath(new URL(jsonUrl).pathname)) {
        const errorData = {
          'Error': 'Could not fetch JSON data. This might be due to permissions or the resource not being accessible.',
          'Details': error.message
        };
        insertDataDiv(errorData);
      }
    });
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
  
  // Check if this domain is allowed
  const isAllowed = await isDomainAllowed(currentDomain);
  if (!isAllowed) {
    return; // Exit if domain is not in the allowed list
  }

  const currentUrl = new URL(window.location.href);
  
  // Check if the current path supports JSON endpoints
  if (!isJsonSupportedPath(currentUrl.pathname)) {
    // console.log('Current path does not support JSON endpoints');
    return;
  }

  chrome.storage.sync.get(['selectedFields'], function(result) {
    const selectedFields = result.selectedFields || [];
    if (selectedFields.length === 0) {
      return;
    }

    // If the current URL is not already a JSON endpoint, append ".json" to the pathname.
    if (!currentUrl.pathname.endsWith('.json')) {
      currentUrl.pathname += '.json';
    }
    const jsonUrl = currentUrl.href;

    // Fetch the JSON data and display the selected fields
    getJsonData(jsonUrl, selectedFields);
  });
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

// Function to initialize the extension
async function initializeExtension() {
  try {
    // Wait for the DOM to be fully loaded
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }

    // Only wait for Shopify admin interface if we're in Shopify admin
    if (isShopifyAdmin()) {
      await waitForShopifyAdmin();
    }

    // Now that everything is ready, update the content
    await updateContent();
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

// Message listener in content.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Handle PING message
  if (request.type === 'PING') {
    sendResponse({ type: 'PONG' });
    return;
  }
  
  if (request.action === "updateContent") {
    // Clear the previous container if it exists
    const container = document.getElementById('shopify-json-fields-container');
    if (container) {
      container.remove();
    }
    initializeExtension();
  }
});

// Initialize the extension when the script loads
initializeExtension();
