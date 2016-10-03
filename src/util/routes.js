
/**
 * Returns routes as a tree representing connections from given stop
 * @param {Object} stop
 * @param {Array} routes
 * @returns {{subpaths: Array}}
 */
function routesToPaths(stop, routes) {
    const paths = [];

    // Get stops after given stop
    const stops = routes.map(({stops}) => {
        const index = stops.map(({stopId}) => stopId).indexOf(stop.stopId);
        return stops.slice(index).map(item => ({...item, duration: item.duration - stops[index].duration}));
    });

    stops.forEach(stop => addStops(paths, stop));
    paths.forEach(path => addRoutes(path, routes));

    return (paths.length > 1) ? {subpaths: paths} : paths[0];
}

/**
 * Recursively adds given stops to path and its subpaths
 * @param {Array} paths
 * @param {Array} stops
 */
const addStops = (paths, stops) => {

    if(!stops || !stops.length) {
        return;
    }

    for(let path of paths) {
        const index = findSplitIndex(path, stops);

        if(index) {
            const commonStops = path.stops.slice(0, index);
            const remainingStops = path.stops.slice(index + 1);

            if(remainingStops.length) {
                if(!path.subpaths) {
                    path.subpaths = [{stops: remainingStops}];
                } else {
                    path.subpaths = [{stops: remainingStops, subpaths: path.subpaths}];
                }
                path.stops = commonStops;
            }

            // Stops in route that don't belong to current path
            const remainingRouteStops = stops.slice(index + 1);

            if(remainingRouteStops.length) {
                if(!path.subpaths) path.subpaths = [];
                addStops(path.subpaths, remainingRouteStops);
            }

            return;
        }
    }

    // No common stops found with paths. Add as new path.
    paths.push({stops});
};

/**
 * Recursively adds route info to paths with no subpaths
 * @param {Object} path
 * @param {Array} routes
 */
function addRoutes(path, routes) {
    if (path.subpaths) {
        path.subpaths.forEach(subpath => addRoutes(subpath, routes));
    } else {
        const lastStop = path.stops[path.stops.length - 1];
        path.routes = routes.filter(({stops}) => stops[stops.length - 1].stopId === lastStop.stopId);
    }
}

/**
 * Returns an index where stop list differs from path
 * @param {Object} path
 * @param {Array} stops
 * @returns {number} - Index
 */
function findSplitIndex(path, stops) {
    for(let i=0;i<path.stops.length;i++) {
        if(i >= stops.length || stops[i].stopId !== path.stops[i].stopId) {
            return i;
        }
    }
    return path.stops.length - 1;
}

export {
    routesToPaths,
};
