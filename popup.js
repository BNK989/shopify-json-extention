document.addEventListener('DOMContentLoaded', function() {
  // Add click event listener to the help icon
  const helpIcon = document.querySelector('.help-icon');
  if (helpIcon) {
    helpIcon.addEventListener('click', function() {
      // Open Shopify's Storefront API documentation in a new tab
      window.open('https://shopify.dev/docs/api/storefront', '_blank');
    });
  }
});