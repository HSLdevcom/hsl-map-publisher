const TRUNK_ROUTES = ['550', '560', '500', '510', '200', '570', '533'];
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

/**
 * Returns whether a route id is belongs to a trunk route
 * @param {String} routeId - Route id
 * @returns {String}
 */
function isTrunkRoute(routeId) {
  return TRUNK_ROUTES.includes(routeId);
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

module.exports = {
  trimRouteId,
};
