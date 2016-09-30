
function routesToPaths(stop, routes) {
    const paths = [];

    // TODO: Subtract duration at starting stop from each duration
    // Get stops after given stop
    const stops = routes.map((route) => {
        const index = route.stops.map(({stopId}) => stopId).indexOf(stop.stopId);
        return route.stops.slice(index);
    });

    stops.forEach(stop => addStops(paths, stop));

    return (paths.length > 1) ? {subpaths: paths} : paths[0];
}

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
 * Returns an index where stop list differs from path
 *
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
