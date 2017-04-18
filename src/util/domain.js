
const RAIL_ROUTE_ID_REGEXP = /^300[12]/;

/**
 * Returns whether a route id is a so called number variant
 * @param {String} id - Route id
 * @returns {String}
 */
export function isNumberVariant(id) {
    return /.{5}[0-9]/.test(id);
}

/**
 * Returns whether a route id is belongs to a rail route
 * @param {String} id - Route id
 * @returns {String}
 */
function isRailRoute(id) {
    return RAIL_ROUTE_ID_REGEXP.test(id);
}

/**
 * Returns route id without area code or leading zeros
 * @param {String} id - Route id
 * @returns {String}
 */
export function trimRouteId(id) {
    if (isRailRoute(id) && isNumberVariant(id)) {
        return id.substring(1, 5).replace(RAIL_ROUTE_ID_REGEXP, "");
    } else if (isRailRoute(id)) {
        return id.replace(RAIL_ROUTE_ID_REGEXP, "");
    } else if (isNumberVariant(id)) {
        // Do not show number variants
        return id.substring(1, 5).replace(/^[0]+/g, "");
    }
    return id.substring(1).replace(/^[0]+/g, "");
}

/**
  * Returns true if the route segment is only for dropping off passengers
  */
export function isDropOffOnly({ pickupDropoffType }) {
    return pickupDropoffType === null || pickupDropoffType === 2;
}
