
const MAX_WIDTH = 6;

function isEqualStop(stop, other) {
    return (stop.name_fi === other.name_fi) &&
           (stop.name_se === other.name_se);
}

function mergeStops(stop, other) {
    const destinations = [...(stop.destinations || []), ...(other.destinations || [])];
    return (destinations.length > 0) ? { ...stop, destinations } : stop;
}

/**
 * Returns an index where stop list differs from path
 * @param {Object} path
 * @param {Array} stops
 * @returns {number} - One-based index (i.e. number of common stops)
 */
function findSplitIndex(path, stops) {
    for (let i = 0; i < path.stops.length; i++) {
        if (i === stops.length || !isEqualStop(stops[i], path.stops[i])) {
            return i;
        }
    }
    return path.stops.length;
}

/**
 * Recursively adds given stops to path and its subpaths
 * @param {Array} paths
 * @param {Array} stops
 */
const addStops = (paths, stops) => {
    if (!stops || !stops.length) {
        return;
    }

    for (const path of paths) {
        const splitIndex = findSplitIndex(path, stops);

        if (splitIndex) {
            const commonStops = path.stops.slice(0, splitIndex)
                .map((stop, index) => mergeStops(stop, stops[index]));
            const remainingPath = path.stops.slice(splitIndex);
            // Stops that don't belong to current path
            const remainingStops = stops.slice(splitIndex);

            if (remainingStops.length) {
                if (remainingPath.length) {
                    if (!path.subpaths) {
                        path.subpaths = [{ stops: remainingPath }];
                    } else {
                        path.subpaths = [{ stops: remainingPath, subpaths: path.subpaths }];
                    }
                    path.stops = commonStops;
                }

                if (!path.subpaths) path.subpaths = [];
                addStops(path.subpaths, remainingStops);
            }

            return;
        }
    }

    // No common stops found with paths. Add as new path.
    paths.push({ stops });
};

function getPathWidth(path) {
    if (path.subpaths) {
        return path.subpaths.reduce((prev, cur) => prev + getPathWidth(cur), 0);
    }
    return 1;
}

function getPathHeight(path) {
    const subHeight = path.subpaths.reduce((prev, cur) => Math.max(getPathHeight(cur), prev), 0);
    return path.stops.length + subHeight;
}

/**
 * Returns deepest (largest amount of preceding nodes) path with two or more sub paths
 * @param {Object} path
 * @param {number} initialDepth
 * @returns {Object} - Path
 */
function findDeepestBranch(path, initialDepth = 0) {
    if (!path.subpaths) return null;
    let pathToReturn = { depth: initialDepth + path.stops.length, path };
    path.subpaths.forEach((subpath) => {
        const pathCandidate = findDeepestBranch(subpath, initialDepth + path.stops.length);
        if (pathCandidate && pathCandidate.depth > pathToReturn.depth) {
            pathToReturn = pathCandidate;
        }
    });
    return pathToReturn;
}

function mergePath(pathToMerge) {
    const destinations = [...pathToMerge.subpaths, pathToMerge]
        .reduce((prev, path) => [...prev, ...path.stops], [])
        .reduce((prev, stop) => [...prev, ...(stop.destinations || [])], []);

    pathToMerge.stops = [  // eslint-disable-line no-param-reassign
        ...pathToMerge.stops,
        { isPlaceHolder: true, destinations },
    ];
    delete pathToMerge.subpaths; // eslint-disable-line no-param-reassign
}

function generalizePath(path) {
    while (getPathWidth(path) > MAX_WIDTH) {
        mergePath(findDeepestBranch(path).path);
    }
    return path;
}

/**
 * Returns routes as a tree representing connections from given stop
 * @param {Object} stop
 * @param {Array} routes
 * @returns {Object}
 */
function routesToPaths(stop, routes) {
    const paths = [];

    // Get stops after given stop
    const stopLists = routes.map((route) => {
        const index = route.stops.map(({ stopId }) => stopId).indexOf(stop.stopId);
        const lastStop = {
            ...route.stops[route.stops.length - 1],
            destinations: [{
                id: route.routeId,
                title: route.destination_fi,
            }],
        };
        const otherStops = route.stops.slice(index, route.stops.length - 1);
        return [...otherStops, lastStop];
    });

    stopLists.forEach(stops => addStops(paths, stops));
    return generalizePath((paths.length > 1) ? { subpaths: paths } : paths[0]);
}

export {
    routesToPaths, // eslint-disable-line import/prefer-default-export
};
