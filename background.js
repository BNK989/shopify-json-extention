// Check saved domains on startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['domains'], function(result) {
    console.log('Currently saved domains:', result.domains || []);
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

// Function to check if URL is allowed based on saved domains
async function isUrlAllowed(url, shouldRequestPermission = false) {
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
        if (pathname.includes('/products/') || 
            pathname.includes('/collections/') || 
            pathname.includes('/pages/') || 
            pathname.includes('/blogs/') || 
            pathname.includes('/cart')) {
          
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

// Handle URL changes (without permission requests)
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId !== 0) return;
  
  try {
    const tab = await chrome.tabs.get(details.tabId);
    const urlToCheck = tab.url;
    // Check URL without requesting permissions
    const allowed = await isUrlAllowed(urlToCheck, false);
    if (allowed) {
      safelySendMessage(details.tabId, { action: "updateContent" });
    }
  } catch (error) {
    console.error('Error getting tab:', error);
  }
}, {
  url: [{ schemes: ['http', 'https'] }]
});

// Also listen for tab updates (without permission requests)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check URL without requesting permissions
    const allowed = await isUrlAllowed(tab.url, false);
    if (allowed) {
      safelySendMessage(tabId, { action: "updateContent" });
    }
  }
});
