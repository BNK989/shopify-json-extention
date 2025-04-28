// Helper functions for the extension

/**
 * Calculates the number of days elapsed since a given date
 * @param {string} dateString - The date string to calculate from (ISO format)
 * @returns {string} Number of days elapsed
 */
function getDaysElapsed(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
  if(diffDays > 0){
    return `${diffDays} days ago`;
  } else if(diffTime > 1000 * 60 * 60){
    return `${Math.ceil(diffTime / (1000 * 60 * 60))} hours ago`;
  }
  else if(diffTime > 1000 * 60){
    return `${Math.ceil(diffTime / (1000 * 60))} min ago`;
  } else {
    return `${Math.ceil(diffTime / 1000)} sec ago`;
  }
}

/**
 * Formats a date string to a more readable format
 * @param {string} dateString - The date string to format (ISO format)
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}.${month}.${year}`;
}

/**
 * Formats a number with commas for thousands
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Converts a camelCase string to snake_case
 * @param {string} str - The camelCase string to convert
 * @returns {string} The converted snake_case string
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Converts a snake_case string to camelCase
 * @param {string} str - The snake_case string to convert
 * @returns {string} The converted camelCase string
 */
function snakeToCamel(str) {
  return str.toLowerCase().replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}


// Export functions to be used in other files
window.bnkUtils = {
  getDaysElapsed,
  formatDate,
  formatNumber,
  snakeToCamel
}; 