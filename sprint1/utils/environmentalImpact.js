/**
 * Environmental Impact Calculation Utilities
 * These calculations are based on average environmental impact data
 * Sources: EPA, environmental research studies, and sustainability reports
 */

// CO2 savings per action type (in kg CO2)
const CO2_SAVINGS = {
  biking: {
    perKm: 0.21, // kg CO2 saved per km compared to car
    perUnit: 2.1 // average 10km bike ride
  },
  walking: {
    perKm: 0.21, // kg CO2 saved per km compared to car
    perUnit: 1.05 // average 5km walk
  },
  public_transport: {
    perKm: 0.089, // kg CO2 saved per km compared to car
    perUnit: 1.78 // average 20km public transport trip
  },
  recycling: {
    paper: 3.3, // kg CO2 saved per kg of paper recycled
    plastic: 2.0, // kg CO2 saved per kg of plastic recycled
    glass: 0.31, // kg CO2 saved per kg of glass recycled
    metal: 1.5, // kg CO2 saved per kg of metal recycled
    perUnit: 1.5 // average mixed recycling per session
  },
  reusable_bag: {
    perUnit: 0.04 // kg CO2 saved per use (vs plastic bag)
  },
  energy_saving: {
    lightBulb: 0.45, // kg CO2 saved per hour with LED vs incandescent
    unplug: 0.6, // kg CO2 saved per day unplugging devices
    perUnit: 2.5 // average energy saving action
  },
  water_conservation: {
    shortShower: 2.5, // kg CO2 saved per shorter shower (5 min reduction)
    fixLeak: 35, // kg CO2 saved per month with fixed leak
    perUnit: 1.8 // average water conservation action
  }
};

// Water savings per action type (in liters)
const WATER_SAVINGS = {
  biking: {
    perUnit: 2 // indirect water savings from reduced car manufacturing demand
  },
  walking: {
    perUnit: 1 // indirect water savings
  },
  public_transport: {
    perUnit: 5 // indirect water savings from reduced car usage
  },
  recycling: {
    paper: 60, // liters saved per kg of paper recycled
    plastic: 88, // liters saved per kg of plastic recycled
    glass: 12, // liters saved per kg of glass recycled
    metal: 95, // liters saved per kg of metal recycled
    perUnit: 50 // average mixed recycling per session
  },
  reusable_bag: {
    perUnit: 0.5 // indirect water savings from reduced plastic production
  },
  energy_saving: {
    perUnit: 15 // water savings from reduced power plant cooling needs
  },
  water_conservation: {
    shortShower: 75, // liters saved per shorter shower (5 min reduction)
    fixLeak: 3000, // liters saved per month with fixed leak
    tapOff: 25, // liters saved by turning off tap while brushing teeth
    perUnit: 45 // average water conservation action
  }
};

// Trees preserved/equivalent per action type
const TREES_PRESERVED = {
  recycling: {
    paper: 0.017, // trees preserved per kg of paper recycled
    perUnit: 0.05 // average trees preserved per recycling session
  },
  biking: {
    perUnit: 0.002 // trees preserved through reduced air pollution
  },
  walking: {
    perUnit: 0.001 // trees preserved through reduced air pollution
  },
  public_transport: {
    perUnit: 0.003 // trees preserved through reduced individual car emissions
  },
  reusable_bag: {
    perUnit: 0.0001 // trees preserved by reducing plastic production
  },
  energy_saving: {
    perUnit: 0.004 // trees preserved by reducing energy demand
  },
  water_conservation: {
    perUnit: 0.002 // trees preserved through water ecosystem protection
  }
};

/**
 * Calculate CO2 savings for a given action
 * @param {string} actionType - Type of sustainable action
 * @param {number} quantity - Quantity/amount of the action
 * @param {string} unit - Unit of measurement (optional)
 * @returns {number} CO2 saved in kg
 */
function calculateCO2Savings(actionType, quantity = 1, unit = 'times') {
  const actionData = CO2_SAVINGS[actionType];
  if (!actionData) return 0;

  // Handle different units and calculations
  switch (actionType) {
    case 'biking':
    case 'walking':
      if (unit === 'km') {
        return actionData.perKm * quantity;
      }
      return actionData.perUnit * quantity;

    case 'public_transport':
      if (unit === 'km') {
        return actionData.perKm * quantity;
      }
      return actionData.perUnit * quantity;

    case 'recycling':
      if (unit === 'kg') {
        // Default to mixed recycling if no specific type
        return actionData.paper * quantity * 0.4 + // 40% paper
               actionData.plastic * quantity * 0.3 + // 30% plastic
               actionData.glass * quantity * 0.2 + // 20% glass
               actionData.metal * quantity * 0.1; // 10% metal
      }
      return actionData.perUnit * quantity;

    case 'water_conservation':
      if (unit === 'minutes') {
        return actionData.shortShower * (quantity / 5); // per 5-minute reduction
      }
      return actionData.perUnit * quantity;

    default:
      return actionData.perUnit * quantity;
  }
}

/**
 * Calculate water savings for a given action
 * @param {string} actionType - Type of sustainable action
 * @param {number} quantity - Quantity/amount of the action
 * @param {string} unit - Unit of measurement (optional)
 * @returns {number} Water saved in liters
 */
function calculateWaterSavings(actionType, quantity = 1, unit = 'times') {
  const actionData = WATER_SAVINGS[actionType];
  if (!actionData) return 0;

  switch (actionType) {
    case 'recycling':
      if (unit === 'kg') {
        return actionData.paper * quantity * 0.4 + // 40% paper
               actionData.plastic * quantity * 0.3 + // 30% plastic
               actionData.glass * quantity * 0.2 + // 20% glass
               actionData.metal * quantity * 0.1; // 10% metal
      }
      return actionData.perUnit * quantity;

    case 'water_conservation':
      if (unit === 'minutes') {
        return actionData.shortShower * (quantity / 5); // per 5-minute reduction
      }
      return actionData.perUnit * quantity;

    default:
      return actionData.perUnit * quantity;
  }
}

/**
 * Calculate trees preserved for a given action
 * @param {string} actionType - Type of sustainable action
 * @param {number} quantity - Quantity/amount of the action
 * @param {string} unit - Unit of measurement (optional)
 * @returns {number} Number of trees preserved (can be fractional)
 */
function calculateTreesPreserved(actionType, quantity = 1, unit = 'times') {
  const actionData = TREES_PRESERVED[actionType];
  if (!actionData) return 0;

  switch (actionType) {
    case 'recycling':
      if (unit === 'kg') {
        return actionData.paper * quantity; // Primarily paper recycling preserves trees
      }
      return actionData.perUnit * quantity;

    default:
      return actionData.perUnit * quantity;
  }
}

/**
 * Calculate comprehensive environmental impact
 * @param {string} actionType - Type of sustainable action
 * @param {number} quantity - Quantity/amount of the action
 * @param {string} unit - Unit of measurement (optional)
 * @returns {Object} Complete impact metrics
 */
function calculateEnvironmentalImpact(actionType, quantity = 1, unit = 'times') {
  return {
    co2Saved: parseFloat(calculateCO2Savings(actionType, quantity, unit).toFixed(3)),
    waterSaved: parseFloat(calculateWaterSavings(actionType, quantity, unit).toFixed(2)),
    treesPreserved: parseFloat(calculateTreesPreserved(actionType, quantity, unit).toFixed(4))
  };
}

/**
 * Get impact description for display purposes
 * @param {Object} impact - Impact metrics object
 * @returns {Object} Formatted impact descriptions
 */
function getImpactDescription(impact) {
  const { co2Saved, waterSaved, treesPreserved } = impact;
  
  return {
    co2Description: `${co2Saved} kg CO₂ saved`,
    waterDescription: `${waterSaved} liters water saved`,
    treesDescription: treesPreserved >= 1 
      ? `${Math.round(treesPreserved)} trees preserved`
      : `${(treesPreserved * 1000).toFixed(0)}g tree-equivalent preserved`,
    summary: `🌱 ${co2Saved}kg CO₂ • 💧 ${waterSaved}L water • 🌳 ${treesPreserved < 1 ? (treesPreserved * 1000).toFixed(0) + 'g' : Math.round(treesPreserved)} trees`
  };
}

module.exports = {
  calculateCO2Savings,
  calculateWaterSavings,
  calculateTreesPreserved,
  calculateEnvironmentalImpact,
  getImpactDescription,
  CO2_SAVINGS,
  WATER_SAVINGS,
  TREES_PRESERVED
};
