import viewportMercator from "viewport-mercator-project";
import { fetchStop, fetchTimetable, fetchRoutes, fetchMap } from "util/api";
import { getStopsFromRoutes } from "util/routes";

function fetchMaps(stop, routes) {
    const mapOptions = {
        center: [stop.lon, stop.lat],
        width: 1500,
        height: 1200,
        scale: 1,
        zoom: 15,
    };

    const miniMapOptions = {
        center: [stop.lon, stop.lat],
        width: 450,
        height: 360,
        zoom: 9,
    };

    const viewport = viewportMercator({
        longitude: mapOptions.center[0],
        latitude: mapOptions.center[1],
        zoom: mapOptions.zoom,
        width: mapOptions.width,
        height: mapOptions.height,
    });

    const stops = getStopsFromRoutes(routes)
        .filter(({ stopId }) => stopId !== stop.stopId)
        .filter(({ lon, lat }) => viewport.contains([lon, lat]))
        .map((stop) => {
            const [x, y] = viewport.project([stop.lon, stop.lat]);
            return { ...stop, x, y };
        });

    return Promise.all([fetchMap(mapOptions), fetchMap(miniMapOptions)])
        .then(([map, miniMap]) => ({ map, miniMap, mapOptions, miniMapOptions, stops }));
}

/**
 * Fetches required props for stop poster component
 * @param id - Stop identifier
 * @returns {Promise}
 */
function fetchStopPosterProps(id) {
    return Promise
        .all([fetchStop(id), fetchTimetable(id), fetchRoutes(id)])
        .then(([stop, timetable, routes]) => (
            fetchMaps(stop, routes).then(map => ({ map, stop, timetable, routes }))
        ));
}

export {
    fetchStopPosterProps, // eslint-disable-line import/prefer-default-export
};
