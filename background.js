// Function to remove the last 5 characters if they exist.
function removeLastFiveCharacters(str) {
  if (typeof str !== 'string' || str.length < 5) {
    return str; // Return original string if not a string or if empty
  }
  return str.slice(0, -5);
}

function isShopifyAdminUrl(url) {
  const regex = /^https:\/\/([^.]+\.myshopify\.com\/admin\/.*|admin\.shopify\.com\/store\/[^/]+(\/[^/]+){1,2})$/;
  return regex.test(url);
}

// this function now makes sure the code runs every time the tab is updated.
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  // check if the code should run on the tab, before running
  console.log('onHistoryStateUpdated')
  chrome.tabs.get(details.tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError);
    } else if (tab.url) {
      // const allowedMatches = ["https://*.myshopify.com/admin/*", "https://admin.shopify.com/store/*/*", "https://admin.shopify.com/store/*/*/*"];
      // const matchFound = allowedMatches.some((match) => tab.url.startsWith(match.replace("*", "")));
      if (isShopifyAdminUrl(tab.url)) {
        console.log(`URL changed to: ${tab.url}`);
        chrome.tabs.sendMessage(details.tabId, { action: "updateContent" });
      }
    }
  });
},
  {
    url: [
      { hostContains: '.myshopify.com' },
      { hostEquals: 'admin.shopify.com' }
    ],
  });
  
  chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
      chrome.tabs.sendMessage(details.tabId, { action: "updateContent" });
    }, { url: [{ hostContains: "myshopify.com/admin" }] });
    

// Listener for when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
  // check if the code should run on the tab, before running
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  } else if (tab.url) {
    const allowedMatches = ["https://*.myshopify.com/admin/*", "https://admin.shopify.com/store/*/*", "https://admin.shopify.com/store/*/*/*"];
    const matchFound = allowedMatches.some((match) => tab.url.startsWith(match.replace("*", "")));
    if (true) {
      chrome.tabs.sendMessage(tab.id, { action: "updateContent" });
    } else {
      console.log("url doesnt match any allowed url");
    }
  } else {
    console.log("no tab url found")
  }
});
