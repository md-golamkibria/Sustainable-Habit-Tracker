// Helper functions for calculating environmental impact

/**
 * Calculate CO2 savings based on action type and quantity
 * @param {string} actionType - Type of sustainable action
 * @param {number} quantity - Quantity/amount of action
 * @returns {number} CO2 saved in kg
 */
function calculateCO2Savings(actionType, quantity = 1) {
  const co2Rates = {
    biking: 0.21 * quantity, // kg CO2 per km
    walking: 0.21 * quantity, // kg CO2 per km (similar to biking vs driving)
    public_transport: 0.089 * quantity, // kg CO2 per km
    recycling: 0.5 * quantity, // kg CO2 per item recycled
    reusable_bag: 0.006 * quantity, // kg CO2 per plastic bag avoided
    energy_saving: 0.45 * quantity, // kg CO2 per hour of energy saved
    water_conservation: 0.001 * quantity, // kg CO2 per liter of water saved
    carpooling: 0.4 * quantity, // kg CO2 per trip
    plant_based_meal: 2.5 * quantity, // kg CO2 per meal
    compost: 0.3 * quantity, // kg CO2 per composting session
    led_bulb: 0.04 * quantity, // kg CO2 per bulb used per day
    shorter_shower: 0.2 * quantity, // kg CO2 per minute saved
    default: 0.1 * quantity
  };

  return co2Rates[actionType] || co2Rates.default;
}

/**
 * Calculate water savings based on action type and quantity
 * @param {string} actionType - Type of sustainable action
 * @param {number} quantity - Quantity/amount of action
 * @returns {number} Water saved in liters
 */
function calculateWaterSavings(actionType, quantity = 1) {
  const waterRates = {
    biking: 0, // No direct water saving from biking
    walking: 0, // No direct water saving from walking
    public_transport: 0, // No direct water saving from public transport
    recycling: 10 * quantity, // liters saved per item recycled
    reusable_bag: 1 * quantity, // liters saved per plastic bag avoided
    energy_saving: 2 * quantity, // liters saved per hour of energy conservation
    water_conservation: 50 * quantity, // liters saved per conservation action
    carpooling: 0, // No direct water saving from carpooling
    plant_based_meal: 150 * quantity, // liters saved per plant-based meal
    compost: 5 * quantity, // liters saved per composting session
    led_bulb: 0.5 * quantity, // liters saved per bulb per day
    shorter_shower: 10 * quantity, // liters saved per minute of shorter shower
    default: 1 * quantity
  };

  return waterRates[actionType] || waterRates.default;
}

/**
 * Calculate points earned based on action type and environmental impact
 * @param {string} actionType - Type of sustainable action
 * @param {number} co2Saved - CO2 saved in kg
 * @param {number} waterSaved - Water saved in liters
 * @returns {number} Points earned
 */
function calculatePoints(actionType, co2Saved, waterSaved) {
  // Base points calculation: 10 points per kg CO2 + 1 point per 10 liters water
  const basePoints = Math.round((co2Saved * 10) + (waterSaved / 10));
  
  // Action type multipliers for variety
  const multipliers = {
    biking: 1.2,
    walking: 1.1,
    public_transport: 1.1,
    recycling: 1.0,
    reusable_bag: 1.0,
    energy_saving: 1.3,
    water_conservation: 1.2,
    carpooling: 1.2,
    plant_based_meal: 1.4,
    compost: 1.1,
    led_bulb: 1.0,
    shorter_shower: 1.1,
    default: 1.0
  };

  const multiplier = multipliers[actionType] || multipliers.default;
  return Math.max(1, Math.round(basePoints * multiplier)); // Minimum 1 point
}

/**
 * Format environmental impact for display
 * @param {number} co2Saved - CO2 saved in kg
 * @param {number} waterSaved - Water saved in liters
 * @returns {object} Formatted impact data
 */
function formatImpact(co2Saved, waterSaved) {
  return {
    co2: {
      value: parseFloat(co2Saved.toFixed(2)),
      unit: 'kg CO₂',
      display: `${co2Saved.toFixed(2)} kg CO₂ saved`
    },
    water: {
      value: parseFloat(waterSaved.toFixed(1)),
      unit: 'liters',
      display: `${waterSaved.toFixed(1)} L water saved`
    }
  };
}

/**
 * Get action category for grouping purposes
 * @param {string} actionType - Type of sustainable action
 * @returns {string} Action category
 */
function getActionCategory(actionType) {
  const categories = {
    biking: 'Transportation',
    walking: 'Transportation', 
    public_transport: 'Transportation',
    carpooling: 'Transportation',
    recycling: 'Waste',
    reusable_bag: 'Waste',
    compost: 'Waste',
    energy_saving: 'Energy',
    led_bulb: 'Energy',
    water_conservation: 'Water',
    shorter_shower: 'Water',
    plant_based_meal: 'Food'
  };

  return categories[actionType] || 'Other';
}

module.exports = {
  calculateCO2Savings,
  calculateWaterSavings,
  calculatePoints,
  formatImpact,
  getActionCategory
};
