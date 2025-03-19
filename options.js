document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings from chrome.storage.sync
  chrome.storage.sync.get(['selectedFields'], function(result) {
    const selectedFields = result.selectedFields || [];
    document.querySelectorAll('input[name="fields"]').forEach(function(checkbox) {
      checkbox.checked = selectedFields.includes(checkbox.value);
    });
  });

  // Save settings when the form is submitted
  document.getElementById('options-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('input[name="fields"]:checked');
    const fields = Array.from(checkboxes).map(checkbox => checkbox.value);
    chrome.storage.sync.set({ selectedFields: fields }, function() {
      alert('Options saved!');
    });
  });
});
