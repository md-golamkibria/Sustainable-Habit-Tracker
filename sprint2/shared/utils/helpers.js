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

/**
 * Calculate CO2 savings based on action type and quantity
 * @param {string} actionType - The type of action
 * @param {number} quantity - The quantity of the action
 * @returns {number} CO2 saved in kg
 */
function calculateCO2Savings(actionType, quantity) {
  const co2Factors = {
    'recycle': 2.3,
    'compost': 0.5,
    'reduce-energy': 0.5,
    'reduce-water': 0.1,
    'bike': 0.21,
    'walk': 0,
    'public-transport': 0.15,
    'plant-based': 1.5,
    'local-food': 0.5,
    'reusable': 0.1,
    'default': 0.5
  };

  const factor = co2Factors[actionType] || co2Factors['default'];
  return Math.round((factor * quantity) * 100) / 100;
}

/**
 * Calculate water savings based on action type and quantity
 * @param {string} actionType - The type of action
 * @param {number} quantity - The quantity of the action
 * @returns {number} Water saved in liters
 */
function calculateWaterSavings(actionType, quantity) {
  const waterFactors = {
    'reduce-water': 10,
    'recycle': 5,
    'compost': 1,
    'reduce-energy': 2,
    'bike': 0,
    'walk': 0,
    'public-transport': 0,
    'plant-based': 50,
    'local-food': 5,
    'reusable': 0,
    'default': 1
  };

  const factor = waterFactors[actionType] || waterFactors['default'];
  return Math.round((factor * quantity) * 100) / 100;
}

module.exports = {
  generateUserId,
  generateActionId,
  formatDate,
  calculateImpactScore,
  calculateCO2Savings,
  calculateWaterSavings
};
