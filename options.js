document.addEventListener('DOMContentLoaded', function() {
  const fieldsContainer = document.getElementById('fields-container');
  const domainsContainer = document.getElementById('domains-container');
  const newFieldInput = document.getElementById('new-field');
  const newDomainInput = document.getElementById('new-domain');
  const addFieldButton = document.getElementById('add-field');
  const addDomainButton = document.getElementById('add-domain');
  
  // Function to create a new field tag
  function createFieldTag(fieldName) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    
    const text = document.createElement('span');
    text.textContent = fieldName;
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove';
    removeButton.innerHTML = '×';
    removeButton.onclick = () => tag.remove();
    
    // Hidden checkbox for form submission
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'fields';
    checkbox.value = fieldName;
    checkbox.checked = true;
    checkbox.className = 'hidden-checkbox';
    
    tag.appendChild(text);
    tag.appendChild(removeButton);
    tag.appendChild(checkbox);
    
    return tag;
  }

  // Function to create a new domain tag
  function createDomainTag(domain) {
    const tag = document.createElement('div');
    tag.className = 'tag domain-tag';
    
    const text = document.createElement('span');
    text.textContent = domain;
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove';
    removeButton.innerHTML = '×';
    removeButton.onclick = () => tag.remove();
    
    // Hidden checkbox for form submission
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'domains';
    checkbox.value = domain;
    checkbox.checked = true;
    checkbox.className = 'hidden-checkbox';
    
    tag.appendChild(text);
    tag.appendChild(removeButton);
    tag.appendChild(checkbox);
    
    return tag;
  }
  
  // Load saved settings from chrome.storage.sync
  chrome.storage.sync.get(['selectedFields', 'domains', 'shopifyDomain', 'storefrontToken', 'metafields', 'getAllFields', 'isPaused', 'activePageTypes'], function(result) {
    // Load regular fields
    const selectedFields = result.selectedFields || ['created_at'];
    selectedFields.forEach(field => {
      fieldsContainer.appendChild(createFieldTag(field));
    });

    // Load domains
    const domains = result.domains || [];
    domains.forEach(domain => {
      domainsContainer.appendChild(createDomainTag(domain));
    });

    // Load advanced settings
    if (result.shopifyDomain) {
      document.getElementById('shopify-domain').value = result.shopifyDomain;
    }
    if (result.storefrontToken) {
      document.getElementById('storefront-token').value = result.storefrontToken;
    }
    if (result.metafields && Array.isArray(result.metafields)) {
      result.metafields.forEach(metafield => addMetafieldTag(metafield));
    }
    
    // Load get all fields toggle state
    document.getElementById('get-all-fields').checked = result.getAllFields || false;

    // Load extension pause state
    document.getElementById('is-paused').checked = result.isPaused || false;

    // Load active page types
    const pageTypes = result.activePageTypes || ['products', 'collections', 'pages', 'blogs', 'cart'];
    document.querySelectorAll('input[name="page-type"]').forEach(checkbox => {
      checkbox.checked = pageTypes.includes(checkbox.value);
    });
  });

  // Single submit handler to save everything
  document.getElementById('options-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get regular fields and domains
    const fields = Array.from(document.querySelectorAll('input[name="fields"]:checked'))
                      .map(checkbox => checkbox.value);
    const domains = Array.from(document.querySelectorAll('input[name="domains"]:checked'))
                      .map(checkbox => checkbox.value);
    
    // Get advanced settings
    const shopifyDomain = document.getElementById('shopify-domain').value;
    const storefrontToken = document.getElementById('storefront-token').value;
    // Fix metafields extraction to only get the span content, not the button
    const metafields = Array.from(document.querySelectorAll('.metafield-tag > span'))
                          .map(span => span.textContent.trim());

    // Save everything at once
    chrome.storage.sync.set({ 
      selectedFields: fields,
      domains: domains,
      shopifyDomain: shopifyDomain,
      storefrontToken: storefrontToken,
      metafields: metafields,
      getAllFields: document.getElementById('get-all-fields').checked,
      isPaused: document.getElementById('is-paused').checked,
      activePageTypes: Array.from(document.querySelectorAll('input[name="page-type"]:checked')).map(cb => cb.value)
    }, function() {
      window.close();
    });
  });
  
  // Add new field when button is clicked
  addFieldButton.addEventListener('click', function() {
    const fieldName = newFieldInput.value.trim();
    if (fieldName) {
      fieldsContainer.appendChild(createFieldTag(fieldName));
      newFieldInput.value = '';
    }
  });

  // Add new domain when button is clicked
  addDomainButton.addEventListener('click', function() {
    const domain = newDomainInput.value.trim().toLowerCase();
    if (domain) {
      domainsContainer.appendChild(createDomainTag(domain));
      newDomainInput.value = '';
    }
  });
  
  // Add field when Enter is pressed
  newFieldInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFieldButton.click();
    }
  });

  // Add domain when Enter is pressed
  newDomainInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDomainButton.click();
    }
  });
  
  // Toggle advanced options
  document.querySelector('.gear-icon').addEventListener('click', toggleAdvanced);
  
function toggleAdvanced() {
  const advancedSection = document.getElementById('advanced-options');
  if (advancedSection.style.display === 'none' || !advancedSection.style.display) {
    advancedSection.style.display = 'block';
    // Scroll to the advanced section after making it visible
    advancedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    advancedSection.style.display = 'none';
  }
}
  
  // Add metafield handling
  document.getElementById('add-metafield').addEventListener('click', function() {
    const newMetafield = document.getElementById('new-metafield').value.trim();
    if (newMetafield && newMetafield.includes('.')) {
      addMetafieldTag(newMetafield);
      document.getElementById('new-metafield').value = '';
    }
  });
  
  // Fix the addMetafieldTag function
  function addMetafieldTag(metafield) {
    const tag = document.createElement('div');
    tag.className = 'tag metafield-tag';
    
    const text = document.createElement('span');
    text.textContent = metafield.trim(); // Clean the input
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove';
    removeButton.innerHTML = '×';
    removeButton.onclick = () => tag.remove();
    
    // Hidden checkbox for form submission
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'metafields';
    checkbox.value = metafield.trim(); // Clean the value
    checkbox.checked = true;
    checkbox.className = 'hidden-checkbox';
    
    tag.appendChild(text);
    tag.appendChild(removeButton);
    tag.appendChild(checkbox);
    
    document.getElementById('metafields-container').appendChild(tag);
  }
});
