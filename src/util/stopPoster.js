import viewportMercator from "viewport-mercator-project";
import { fetchStop, fetchStops, fetchRoutes, fetchTimetable, fetchMap } from "util/api";

const MAX_STOPS = 8;

const MAX_ZOOM = 18;
const MIN_ZOOM = 14;
const STEP_ZOOM = 0.1;

const MAP_WIDTH = 1500;
const MAP_HEIGHT = 1200;

const MINI_MAP_WIDTH = 450;
const MINI_MAP_HEIGHT = 360;
const MINI_MAP_ZOOM = 9;

function createViewport(stop, zoom) {
    return viewportMercator({
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        longitude: stop.lon,
        latitude: stop.lat,
        zoom,
    });
}

function calculateStopsViewport(centeredStop, stops) {
    let zoom;
    let viewport;
    let visibleStops = stops.filter(({ stopId }) => stopId !== centeredStop.stopId);

    // Increase zoom level until only max number of stops visible
    for (zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom += STEP_ZOOM) {
        viewport = createViewport(centeredStop, zoom);
        visibleStops = visibleStops.filter(({ lon, lat }) => viewport.contains([lon, lat])); // eslint-disable-line
        if (visibleStops.length <= MAX_STOPS) break;
    }

    // Calculate pixel coordinates for each stop
    const projectedStops = visibleStops.map((stop) => {
        const [x, y] = viewport.project([stop.lon, stop.lat]);
        return { ...stop, x, y };
    });

    return { stops: projectedStops, zoom };
}

function fetchRoutesForStops(options) {
    const promises = options.stops.map(
        stop => fetchRoutes(stop.stopId).then(routes => ({ ...stop, routes }))
    );
    return Promise.all(promises).then(stops => ({ ...options, stops }));
}

function fetchMaps(stop) {
    // FIXME: Fetch active stops groups with valid timetables instead of all stops
    return fetchStops()
        .then(stops => calculateStopsViewport(stop, stops))
        .then(options => fetchRoutesForStops(options))
        .then(({ stops, zoom }) => {
            const mapOptions = {
                center: [stop.lon, stop.lat],
                width: MAP_WIDTH,
                height: MAP_HEIGHT,
                zoom,
            };

            const miniMapOptions = {
                center: [stop.lon, stop.lat],
                width: MINI_MAP_WIDTH,
                height: MINI_MAP_HEIGHT,
                zoom: MINI_MAP_ZOOM,
            };

            return Promise
                .all([fetchMap(mapOptions), fetchMap(miniMapOptions)])
                .then(([map, miniMap]) => ({ map, miniMap, mapOptions, miniMapOptions, stops }));
        });
}

/**
 * Fetches required props for stop poster component
 * @param stopId - Stop identifier
 * @returns {Promise}
 */
function fetchStopPosterProps(stopId) {
    return Promise
        .all([fetchStop(stopId), fetchTimetable(stopId), fetchRoutes(stopId)])
        .then(([stop, timetable, routes]) => (
            fetchMaps(stop).then(map => ({ map, stop, timetable, routes }))
        ));
}

export {
    fetchStopPosterProps, // eslint-disable-line import/prefer-default-export
};
