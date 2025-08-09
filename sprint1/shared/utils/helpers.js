/**
 * Helper utility functions for the application
 */

/**
 * Generate a unique user ID
 * @returns {string} A unique user ID
 */
function generateUserId() {
  return 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a unique action ID
 * @returns {string} A unique action ID
 */
function generateActionId() {
  return 'action_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Format date for display
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Calculate environmental impact score
 * @param {Object} action - The action object
 * @returns {number} Impact score
 */
function calculateImpactScore(action) {
  // Basic impact calculation - can be enhanced
  const baseScore = 10;
  const frequencyMultiplier = action.frequency || 1;
  const impactMultiplier = action.impactLevel || 1;
  
  return baseScore * frequencyMultiplier * impactMultiplier;
}

module.exports = {
  generateUserId,
  generateActionId,
  formatDate,
  calculateImpactScore
};
