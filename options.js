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
  chrome.storage.sync.get(['selectedFields', 'domains'], function(result) {
    const selectedFields = result.selectedFields || ['created_at'];
    selectedFields.forEach(field => {
      fieldsContainer.appendChild(createFieldTag(field));
    });

    const domains = result.domains || [];
    domains.forEach(domain => {
      domainsContainer.appendChild(createDomainTag(domain));
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
  
  // Save settings when the form is submitted
  document.getElementById('options-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Save fields
    const fieldCheckboxes = document.querySelectorAll('input[name="fields"]:checked');
    const fields = Array.from(fieldCheckboxes).map(checkbox => checkbox.value);
    
    // Save domains
    const domainCheckboxes = document.querySelectorAll('input[name="domains"]:checked');
    const domains = Array.from(domainCheckboxes).map(checkbox => checkbox.value);

    // Save both fields and domains
    chrome.storage.sync.set({ 
      selectedFields: fields,
      domains: domains
    }, function() {
      // Close the popup after saving
      window.close();
    });
  });
});
