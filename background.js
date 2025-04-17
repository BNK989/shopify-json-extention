// Check saved settings on startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['domains', 'isPaused', 'activePageTypes'], function(result) {
    console.log('Currently saved domains:', result.domains || []);
    // Set default values if not exists
    if (result.activePageTypes === undefined) {
      chrome.storage.sync.set({
        activePageTypes: ['products', 'collections', 'pages', 'blogs', 'cart'],
        isPaused: false
      });
    }
  });
});

// Function to remove the last 5 characters if they exist.
function removeLastFiveCharacters(str) {
  if (typeof str !== 'string' || str.length < 5) {
    return str; // Return original string if not a string or if empty
  }
  return str.slice(0, -5);
}

// Helper function to request host permissions
async function requestHostPermission(url) {
  try {
    const origin = new URL(url).origin + '/*';
    console.log('Requesting permission for:', origin);
    
    const granted = await chrome.permissions.request({
      origins: [origin]
    });
    
    if (granted) {
      console.log('Host permission granted for:', origin);
      return true;
    } else {
      console.log('Host permission denied for:', origin);
      return false;
    }
  } catch (error) {
    console.error('Error requesting host permission:', error);
    return false;
  }
}

// Function to check if URL is allowed based on saved domains and settings
async function isUrlAllowed(url, shouldRequestPermission = false) {
  // First check if extension is paused
  const settings = await chrome.storage.sync.get(['isPaused', 'activePageTypes']);
  // Return false immediately if extension is paused, before any URL validation
  if (settings.isPaused) {
    console.log('Extension is paused');
    return false;
  }
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname.toLowerCase();
    const pathname = decodeURIComponent(urlObj.pathname.toLowerCase());
    
    // Remove 'www.' from the hostname if it exists
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    
    // console.log('Checking URL components:', {
    //   fullUrl: url,
    //   originalHostname: urlObj.hostname,
    //   processedHostname: hostname,
    //   decodedPath: pathname
    // });

    // Check if it's a Shopify admin URL
    if (hostname.includes('myshopify.com') || hostname === 'admin.shopify.com') {
      // console.log('✓ Shopify domain detected');
      return true;
    }

    // Get custom domains from storage
    const result = await chrome.storage.sync.get(['domains']);
    const customDomains = result.domains || [];
    // console.log('Custom domains to check against:', customDomains);

    // Check custom domains
    for (const domain of customDomains) {
      const savedDomain = domain.toLowerCase().trim();
      // console.log('Domain comparison:', {
      //   savedDomain,
      //   hostname,
      //   exactMatch: hostname === savedDomain,
      //   endsWithMatch: hostname.endsWith(savedDomain)
      // });
      
      // Direct match or subdomain match (excluding www)
      if (hostname === savedDomain || 
          (hostname.endsWith(savedDomain) && hostname.charAt(hostname.length - savedDomain.length - 1) === '.')) {
        // console.log(`✓ Domain match found for: ${savedDomain}`);
        
        // For custom domains, check if the path contains product-related segments
        // Check if the current page type is enabled
const activePageTypes = settings.activePageTypes || ['products', 'collections', 'pages', 'blogs', 'cart'];
const isPageTypeActive = (
  (pathname.includes('/products/') && activePageTypes.includes('products')) ||
  (pathname.includes('/collections/') && activePageTypes.includes('collections')) ||
  (pathname.includes('/pages/') && activePageTypes.includes('pages')) ||
  (pathname.includes('/blogs/') && activePageTypes.includes('blogs')) ||
  (pathname.includes('/cart') && activePageTypes.includes('cart'))
);

if (isPageTypeActive) {
          
          // console.log('✓ Valid path pattern found:', pathname);
          
          // Only request permission during user gesture
          if (shouldRequestPermission) {
            const hasPermission = await requestHostPermission(url);
            if (!hasPermission) {
              console.log('❌ Host permission not granted');
              return false;
            }
          }
          
          return true;
        } else {
          console.log('✗ No valid path pattern found in:', pathname);
        }
      } //else {
        //console.log(`✗ No domain match for: ${savedDomain}`);
      //}
    }

    // console.log('✗ No matching domain/path combination found');
    return false;

  } catch (error) {
    console.error('Error checking URL:', error);
    return false;
  }
}

// Helper function to inject content script
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['utils.js', 'content.js']
    });
    return true;
  } catch (error) {
    console.log('Failed to inject content script:', error);
    return false;
  }
}

// Helper function to safely send messages
async function safelySendMessage(tabId, message) {
  try {
    // Try sending the message first
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    } catch (error) {
      // If message fails, content script might not be injected
      // console.log('Content script not ready, attempting to inject...');
      const injected = await injectContentScript(tabId);
      if (!injected) {
        throw new Error('Failed to inject content script');
      }
      // Wait a short moment for the script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Now try to send the actual message
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.log('Tab not ready for messages or not accessible:', error);
  }
}

// Listener for when the extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked');
  if (tab?.url) {
    // Check URL and request permissions if needed (during user gesture)
    const allowed = await isUrlAllowed(tab.url, true);
    if (allowed) {
      safelySendMessage(tab.id, { action: "updateContent" });
    } else {
      console.log("URL not allowed:", tab.url);
    }
  } else {
    console.log("No tab URL found");
  }
});

// Add a tracking object to prevent duplicate updates
const processedUrls = {};

// Handle URL changes (without permission requests)
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  // Check if extension is paused first
  const { isPaused } = await chrome.storage.sync.get(['isPaused']);
  if (isPaused) {
    console.log('Extension is paused, skipping history update.');
    return;
  }

  console.log('History state updated:', details); // Moved log after pause check
  if (details.frameId !== 0) return;
  
  try {
    const tab = await chrome.tabs.get(details.tabId);
    const urlToCheck = tab.url;
    
    // Skip if we've already processed this URL recently
    const urlKey = `${details.tabId}:${urlToCheck}`;
    if (processedUrls[urlKey] && (Date.now() - processedUrls[urlKey]) < 30000) {
      console.log('Skipping duplicate history update for:', urlToCheck);
      return;
    }
    
    // Check URL without requesting permissions
    const allowed = await isUrlAllowed(urlToCheck, false);
    if (allowed) {
      // Track this URL as processed
      processedUrls[urlKey] = Date.now();
      
      // Add a flag to indicate this is from the history state update event
      safelySendMessage(details.tabId, { action: "updateContent", source: "historyUpdate" });
    }
  } catch (error) {
    console.error('Error getting tab:', error);
  }
}, {
  url: [{ schemes: ['http', 'https'] }]
});

// Also listen for tab updates (without permission requests)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process if the tab has completely loaded and has a URL
  if (changeInfo.status === 'complete' && tab.url) {
    // First check if extension is paused
    const { isPaused } = await chrome.storage.sync.get(['isPaused']);
    if (isPaused) {
      console.log('Extension is paused, skipping tab update.');
      return;
    }

    // Skip if we've already processed this URL recently
    const urlKey = `${tabId}:${tab.url}`;
    if (processedUrls[urlKey] && (Date.now() - processedUrls[urlKey]) < 30000) {
      console.log('Skipping duplicate tab update for:', tab.url);
      return;
    }
    
    // Check URL without requesting permissions
    const allowed = await isUrlAllowed(tab.url, false);
    if (allowed) {
      // Track this URL as processed
      processedUrls[urlKey] = Date.now();
      
      // Add a flag to indicate this is from the tab update event
      safelySendMessage(tabId, { action: "updateContent", source: "tabUpdate" });
    }
  }
});

// Create context menu on install
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.contextMenus.create({
//     id: 'debug-metafields',
//     title: 'Debugger',
//     contexts: ['page']
//   });
// });

// // Handle context menu clicks
// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === 'debug-metafields') {
//     chrome.scripting.executeScript({
//       target: {tabId: tab.id},
//       function: () => {
//         // This will execute in the context of the current page
//         getMetafieldData(7968708558908, ["custom.zip_code", "custom.city"])
//           .then(results => console.log('Debug Results:', results));
//       }
//     });
//   }
// });

// Add this new listener for Shopify admin pages
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Check if extension is paused first
  const { isPaused } = await chrome.storage.sync.get(['isPaused']);
  if (isPaused) {
    console.log('Extension is paused, skipping Shopify admin navigation completion.');
    return;
  }

  console.log('Shopify admin page navigation completed:', details);
  if (details.frameId !== 0) return;
  
  try {
    const tab = await chrome.tabs.get(details.tabId);
    const url = tab.url;
    
    // Skip if not Shopify admin
    if (!url.includes('myshopify.com') && !url.includes('admin.shopify.com')) {
      return;
    }
    
    // Skip if we've already processed this URL recently
    const urlKey = `${details.tabId}:${url}`;
    if (processedUrls[urlKey] && (Date.now() - processedUrls[urlKey]) < 1000) {
      return;
    }
    
    // Track this URL as processed
    processedUrls[urlKey] = Date.now();
    
    // Send update message with special flag
    safelySendMessage(details.tabId, {
      action: "updateContent",
      source: "shopifyAdminNav"
    });
    
  } catch (error) {
    console.error('Error handling Shopify admin navigation:', error);
  }
}, {
  url: [
    { hostContains: 'myshopify.com' },
    { hostEquals: 'admin.shopify.com' }
  ]
});

// REMOVED the second redundant chrome.tabs.onUpdated listener
