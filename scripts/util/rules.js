const RAIL_ROUTE_ID_REGEXP = /^300[12]/;
const SUBWAY_ROUTE_ID_REGEXP = /^31/;
const U_LINE_REGEX = /^7/;

/**
 * Returns whether a route id is a so called number variant
 * @param {String} routeId - Route id
 * @returns {boolean}
 */
function isNumberVariant(routeId) {
  return /.{5}[0-9]/.test(routeId);
}

/**
 * Returns whether a route id is belongs to a rail route
 * @param {String} routeId - Route id
 * @returns {boolean}
 */
function isRailRoute(routeId) {
  return RAIL_ROUTE_ID_REGEXP.test(routeId);
}

/**
 * Returns whether a route id is belongs to a subway route
 * @param {String} routeId - Route id
 * @returns {boolean}
 */
function isSubwayRoute(routeId) {
  return SUBWAY_ROUTE_ID_REGEXP.test(routeId);
}

function isULine(routeId) {
  return U_LINE_REGEX.test(routeId);
}

/**
 * Returns route id without area code or leading zeros
 * @param {String} routeId - Route id
 * @returns {String}
 */
function trimRouteId(routeId, skipULine) {
  if (isRailRoute(routeId) && isNumberVariant(routeId)) {
    return routeId.substring(0, 5).replace(RAIL_ROUTE_ID_REGEXP, '');
  }
  if (isRailRoute(routeId)) {
    return routeId.replace(RAIL_ROUTE_ID_REGEXP, '');
  }
  if (isSubwayRoute(routeId) && isNumberVariant(routeId)) {
    return routeId.substring(1, 5).replace(SUBWAY_ROUTE_ID_REGEXP, '');
  }
  if (isSubwayRoute(routeId)) {
    return routeId.replace(SUBWAY_ROUTE_ID_REGEXP, '');
  }

  if (isULine(routeId) && !skipULine) {
    return routeId.substring(0, 5).replace(U_LINE_REGEX, 'U');
  }

  if (isNumberVariant(routeId)) {
    // Do not show number variants
    return routeId.substring(1, 5).replace(/^[0]+/g, '');
  }

  return routeId.substring(1).replace(/^[0]+/g, '');
}

/**
 * Returns whether the stop data matches all the rules.
 * Is called recursively
 * @param {Object} rules - Template rules
 * @param {Object} stop - Stop data
 * @returns {Boolean}
 */
function matchStopDataToRules(rules, data) {
  // Function to check subrules and evaluate operands
  const evaluateOper = ruleset => {
    const checkSubRules = subrules => matchStopDataToRules(subrules, data);
    switch (ruleset.name) {
      case 'AND':
        return ruleset.value.every(checkSubRules);
      case 'OR':
        return ruleset.value.some(checkSubRules);
      case 'NOT':
        return !checkSubRules(ruleset.value);
      default:
        throw new Error(`Invalid operand name: ${ruleset.name}`);
    }
  };

  // function to evaluate the specific rule
  const evaluateRule = ruleset => {
    switch (ruleset.name) {
      case 'CITY':
        return ruleset.value === data.city;
      case 'MODE':
        return data.modes.includes(ruleset.value);
      case 'ZONE':
        return ruleset.value === data.stopZone;
      case 'ROUTE':
        return data.routeIds.includes(ruleset.value);
      default:
        throw new Error(`Invalid rule name: ${ruleset.name}`);
    }
  };

  switch (rules.type) {
    case 'OPER':
      return evaluateOper(rules, data);
    case 'RULE':
      return evaluateRule(rules, data);
    default:
      throw new Error(`Invalid rule type: ${rules.type}`);
  }
}

module.exports = {
  trimRouteId,
  matchStopDataToRules,
};
