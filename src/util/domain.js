import busIcon from 'icons/icon_bus.svg';
import tramIcon from 'icons/icon_tram.svg';
import railIcon from 'icons/icon_rail.svg';
import subwayIcon from 'icons/icon_subway.svg';
import ferryIcon from 'icons/icon_ferry.svg';
import trunkIcon from 'icons/icon_trunk.svg';

import zoneByShortId from 'data/zoneByShortId';

// TODO: Get routes from api?
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
 * Returns true if the route segment is only for dropping off passengers
 * @returns {boolean}
 */
function isDropOffOnly({ pickupDropoffType }) {
  return pickupDropoffType === null || pickupDropoffType === 2;
}

function getZoneName(shortId) {
  if (zoneByShortId[shortId]) return zoneByShortId[shortId];
  if (shortId.startsWith('H')) return 'Helsinki';
  if (shortId.startsWith('V')) return 'Vantaa';
  if (shortId.startsWith('E')) return 'Espoo-Kauniainen';
  if (shortId.startsWith('Ka')) return 'Espoo-Kauniainen';
  if (shortId.startsWith('Ke')) return 'Kerava-Sipoo-Tuusula';
  if (shortId.startsWith('Si')) return 'Kerava-Sipoo-Tuusula';
  if (shortId.startsWith('Tu')) return 'Kerava-Sipoo-Tuusula';
  if (shortId.startsWith('Ki')) return 'Kirkkonummi-Siuntio';
  if (shortId.startsWith('So')) return 'Kirkkonummi-Siuntio';
  return null;
}

const colorsByMode = {
  TRUNK: '#ff6319',
  LIGHT_TRUNK: '#FFE0D1',
  TRAM: '#00985f',
  RAIL: '#8c4799',
  SUBWAY: '#ff6319',
  BUS: '#007AC9',
  FERRY: '#00B9E4',
  L_RAIL: '#007E79',
  LIGHT_L_RAIL: '#e5f2f1',
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
  if (route.trunkRoute) {
    return colorsByMode.TRUNK;
  }
  return colorsByMode[route.mode];
}

function getIcon(route) {
  if (route.trunkRoute) {
    return iconsByMode.TRUNK;
  }
  return iconsByMode[route.mode];
}

function createDictionary(generalizedRoutes) {
  const routeDictionary = {};
  generalizedRoutes.forEach(element => {
    if (Object.prototype.hasOwnProperty.call(routeDictionary, element.route)) {
      if (routeDictionary[element.route].indexOf(element.version) < 0) {
        routeDictionary[element.route].push(element.version);
        routeDictionary[element.route].sort();
      }
    } else {
      routeDictionary[element.route] = [element.version];
    }
  });
  return routeDictionary;
}

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = arr1.length; i--; ) {
    if (arr1[i] !== arr2[i]) return false;
  }

  return true;
}

function groupOnVersionList(routeDictionary) {
  const groupedVersions = [];
  Object.entries(routeDictionary).forEach(([route, versions]) => {
    const old = groupedVersions.filter(group => arraysEqual(group.versions, versions));
    if (old.length > 0) {
      old[0].routes.push(route);
      old[0].routes.sort();
    } else {
      groupedVersions.push({ versions, routes: [route] });
    }
  });
  return groupedVersions;
}

function groupOnConsecutiveInt(array) {
  const result = [];
  let temp = [];
  let difference;
  for (let i = 0; i < array.length; i += 1) {
    if (
      !Number.isNaN(parseInt(array[i], 10)) &&
      (difference !== parseInt(array[i], 10) - i ||
        // Split between trams (1-10) and buses (11-)
        parseInt(array[i], 10) === 11)
    ) {
      if (difference !== undefined) {
        result.push(temp);
        temp = [];
      }
      difference = parseInt(array[i], 10) - i;
    }
    temp.push(Number.isNaN(parseInt(array[i], 10)) ? array[i] : parseInt(array[i], 10));
  }

  if (temp.length) {
    result.push(temp);
  }

  return result;
}

function groupOnConsecutive(groupedOnVersion) {
  const flatList = [];
  groupedOnVersion.forEach(group => {
    groupOnConsecutiveInt(group.routes).forEach(consGroup => {
      flatList.push({ routes: consGroup, versions: group.versions });
    });
  });
  return flatList.sort((a, b) => a.routes[0] - b.routes[0]);
}

function getListOfVersionsAsString(versions) {
  const alsoBasic = versions.some(version => version && version.trim() === '');
  const letters = versions.filter(version => version && version.trim() !== '').sort();
  if (letters.length === 0) return '';
  const letterString = letters.join(',');
  if (alsoBasic) return `(${letterString})`;
  return letterString;
}

function labelAsComponents(routes) {
  return routes.map(routeGroup => {
    const letterString = getListOfVersionsAsString(routeGroup.versions);
    const type = routeGroup.routes[0] <= 10 ? 'tram' : 'bus';
    if (routeGroup.routes.length === 1) {
      return {
        text: `${routeGroup.routes[0]}${letterString}`,
        type,
      };
    }
    if (routeGroup.routes.length === 2) {
      return {
        text: `${routeGroup.routes[0]}${letterString} ${routeGroup.routes[1]}${letterString}`,
        type,
      };
    }
    if (routeGroup.versions.length === 1) {
      return {
        text: `${routeGroup.routes[0]}${letterString}-${
          routeGroup.routes[routeGroup.routes.length - 1]
        }${letterString}`,
        type,
      };
    }
    return {
      text: `${routeGroup.routes[0]}-${
        routeGroup.routes[routeGroup.routes.length - 1]
      }${letterString}`,
      type,
    };
  });
}

function splitRouteString(routeString) {
  const parts = routeString.split(/(\d+)/g);
  if (parts.length === 3) {
    return { route: parts[1], version: parts[2] };
  }
  return { route: routeString, version: null };
}

function routeGeneralizer(routes) {
  const fixedRoutes = routes.filter(r => r !== '18V');
  // ["103", "103T", "102", "102T"]

  // -> [
  //      {route: "103", version: "T"},
  //      {route: "103", version: null},
  //      {route: "102", version: "T"},
  //      {route: "103", version: null},
  //    ]
  const routesSplittedOnNumberAndVersion = fixedRoutes.map(str => splitRouteString(str));

  // -> { 103: ["", "T"], 102: ["", "T"]}
  const dictionaryWithGroupedOnRoute = createDictionary(routesSplittedOnNumberAndVersion);

  // -> [{versions: ["", T], routes: [102, 103]}]
  const listGroupedOnVersionList = groupOnVersionList(dictionaryWithGroupedOnRoute);

  // -> [{routes: [102, 103], versions: ["", "T"]}]
  const flatListOnConsecutiveRouteNumbers = groupOnConsecutive(listGroupedOnVersionList);

  // -> "102-103(T)"
  return labelAsComponents(flatListOnConsecutiveRouteNumbers);
}

function filterRoute(props) {
  const { filter } = props;
  const { routeId } = props;
  if (!filter) {
    return true;
  }
  for (let i = 0; i < filter.length; i++) {
    const char = filter[i];
    if (char !== '*' && char === routeId[i]) {
      return false;
    }
  }
  return true;
}

export {
  isNumberVariant,
  isRailRoute,
  isSubwayRoute,
  isULine,
  trimRouteId,
  isDropOffOnly,
  getZoneName,
  colorsByMode,
  iconsByMode,
  getColor,
  getIcon,
  routeGeneralizer,
  filterRoute,
};
