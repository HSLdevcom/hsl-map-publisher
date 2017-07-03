import busIcon from "icons/icon_bus.svg";
import tramIcon from "icons/icon_tram.svg";
import railIcon from "icons/icon_rail.svg";
import subwayIcon from "icons/icon_subway.svg";
import ferryIcon from "icons/icon_ferry.svg";
import trunkIcon from "icons/icon_trunk.svg";

const TRUNK_ROUTES = ["550", "560"];
const RAIL_ROUTE_ID_REGEXP = /^300[12]/;
const SUBWAY_ROUTE_ID_REGEXP = /^31/;

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

/**
 * Returns route id without area code or leading zeros
 * @param {String} routeId - Route id
 * @returns {String}
 */
function trimRouteId(routeId) {
    if (isRailRoute(routeId) && isNumberVariant(routeId)) {
        return routeId.substring(1, 5).replace(RAIL_ROUTE_ID_REGEXP, "");
    } else if (isRailRoute(routeId)) {
        return routeId.replace(RAIL_ROUTE_ID_REGEXP, "");
    } else if (isSubwayRoute(routeId) && isNumberVariant(routeId)) {
        return routeId.substring(1, 5).replace(SUBWAY_ROUTE_ID_REGEXP, "");
    } else if (isSubwayRoute(routeId)) {
        return routeId.replace(SUBWAY_ROUTE_ID_REGEXP, "");
    } else if (isNumberVariant(routeId)) {
        // Do not show number variants
        return routeId.substring(1, 5).replace(/^[0]+/g, "");
    }
    return routeId.substring(1).replace(/^[0]+/g, "");
}

/**
 * Returns true if the route segment is only for dropping off passengers
 * @returns {boolean}
 */
function isDropOffOnly({ pickupDropoffType }) {
    return pickupDropoffType === null || pickupDropoffType === 2;
}

function getZoneName(shortId) {
    if (shortId.startsWith("H")) return "Helsinki";
    if (shortId.startsWith("V")) return "Vantaa";
    if (shortId.startsWith("Si1403")) return "Vantaa";
    if (shortId.startsWith("Si1404")) return "Vantaa";
    if (shortId.startsWith("Nu0029")) return "Vantaa";
    if (shortId.startsWith("Nu0030")) return "Vantaa";
    if (shortId.startsWith("E")) return "Espoo-Kauniainen";
    if (shortId.startsWith("Ka")) return "Espoo-Kauniainen";
    if (shortId.startsWith("Ke")) return "Kerava-Sipoo";
    if (shortId.startsWith("Si")) return "Kerava-Sipoo";
    if (shortId.startsWith("Pn4017")) return "Kerava-Sipoo";
    if (shortId.startsWith("Pn4018")) return "Kerava-Sipoo";
    if (shortId.startsWith("Ki")) return "Kirkkonummi";
    return null;
}

const colorsByMode = {
    TRUNK: "#ff6319",
    TRAM: "#00985f",
    RAIL: "#8c4799",
    SUBWAY: "#ff6319",
    BUS: "#007AC9",
    FERRY: "#00B9E4",
};

const iconsByMode = {
    BUS: busIcon,
    TRAM: tramIcon,
    RAIL: railIcon,
    SUBWAY: subwayIcon,
    FERRY: ferryIcon,
    TRUNK: trunkIcon,
};

function getColor(route) {
    if (isTrunkRoute(route.routeId)) {
        return colorsByMode.TRUNK;
    }
    return colorsByMode[route.mode];
}

function getIcon(route) {
    if (isTrunkRoute(route.routeId)) {
        return iconsByMode.TRUNK;
    }
    return iconsByMode[route.mode];
}


export {
    isNumberVariant,
    isRailRoute,
    isSubwayRoute,
    isTrunkRoute,
    trimRouteId,
    isDropOffOnly,
    getZoneName,
    colorsByMode,
    iconsByMode,
    getColor,
    getIcon,
};
