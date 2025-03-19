// Function to inject a styled div showing the selected field data
function insertDataDiv(data) {
  let container = document.getElementById('shopify-json-fields-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'shopify-json-fields-container';
    // Basic styling – adjust as needed
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      padding: '10px',
      zIndex: '10000',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      maxWidth: '300px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px'
    });
    document.body.appendChild(container);
  }
  container.innerHTML = '<h3 style="margin-top: 0;">Selected Fields</h3>';
  for (const [key, value] of Object.entries(data)) {
    const p = document.createElement('p');
    p.style.margin = '4px 0';
    p.textContent = `${key}: ${value}`;
    container.appendChild(p);
  }
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
      console.log('Fetched JSON:', json);
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
        // Also log each selected field for debugging
        console.log(`Field: ${field}, Value: ${value}`);
      });
      insertDataDiv(fieldsData);
    })
    .catch(error => {
      console.error('Error fetching JSON data:', error);
    });
}

// Retrieve the user-selected fields from storage and fetch the JSON data
function updateContent() {
  chrome.storage.sync.get(['selectedFields'], function (result) {
    const selectedFields = result.selectedFields || [];
    if (selectedFields.length === 0) return; // Nothing to display if no fields selected

    const currentUrl = new URL(window.location.href);
    // If the current URL is not already a JSON endpoint, append ".json" to the pathname.
    if (!currentUrl.pathname.endsWith('.json')) {
      currentUrl.pathname += '.json';
    }
    const jsonUrl = currentUrl.href;

    // Fetch the JSON data and display the selected fields
    getJsonData(jsonUrl, selectedFields);
  });
}

// Message listener in content.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('Message received in background.js', request);
  if (request.action === "updateContent") {
    console.log("updateContent message received in content.js");
    // Clear the previous container if it exists
    const container = document.getElementById('shopify-json-fields-container');
    if (container) {
      container.remove();
    }
    updateContent();
  }
});

// updateContent()
