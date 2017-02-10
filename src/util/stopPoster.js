import WebMercatorViewport from "viewport-mercator-project/dist/web-mercator-viewport";
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
    return new WebMercatorViewport({
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        longitude: stop.lon,
        latitude: stop.lat,
        zoom,
    });
}

function viewportContains(viewport, stop) {
    const [x, y] = viewport.project([stop.lon, stop.lat], { topLeft: true });
    return x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height;
}

function calculateStopsViewport(centeredStop, stops) {
    let viewport;
    let visibleStops = stops.filter(({ stopId }) => stopId !== centeredStop.stopId);

    // Increase zoom level until only max number of stops visible
    for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom += STEP_ZOOM) {
        viewport = createViewport(centeredStop, zoom);
        visibleStops = visibleStops.filter(stop => viewportContains(viewport, stop)); // eslint-disable-line
        if (visibleStops.length <= MAX_STOPS) break;
    }

    // Calculate pixel coordinates for each stop
    const projectedStops = visibleStops.map((stop) => {
        const [x, y] = viewport.project([stop.lon, stop.lat], { topLeft: true });
        return { ...stop, x, y };
    });

    return { stops: projectedStops, viewport };
}

function fetchRoutesForStops(options) {
    const promises = options.stops.map(
        stop => fetchRoutes(stop.stopId).then(routes => ({ ...stop, routes }))
    );
    return Promise.all(promises).then(stops => ({ ...options, stops }));
}

function fetchMaps(stop) {
    return fetchStops()
        .then(stops => calculateStopsViewport(stop, stops))
        .then(options => fetchRoutesForStops(options))
        .then(({ stops, viewport }) => {
            const pixelsPerMeter = viewport.getDistanceScales().pixelsPerMeter[0];

            const mapOptions = {
                center: [stop.lon, stop.lat],
                width: MAP_WIDTH,
                height: MAP_HEIGHT,
                zoom: viewport.zoom,
            };

            const miniMapOptions = {
                center: [stop.lon, stop.lat],
                width: MINI_MAP_WIDTH,
                height: MINI_MAP_HEIGHT,
                zoom: MINI_MAP_ZOOM,
            };

            return Promise
                .all([fetchMap(mapOptions), fetchMap(miniMapOptions)])
                .then(([map, miniMap]) => ({
                    map,
                    mapOptions,
                    miniMap,
                    miniMapOptions,
                    stops,
                    pixelsPerMeter,
                }));
        });
}

/**
 * Fetches required state for stop poster component
 * @param stopId - Stop identifier
 * @returns {Promise}
 */
function fetchStopPosterState(stopId) {
    return Promise
        .all([fetchStop(stopId), fetchTimetable(stopId), fetchRoutes(stopId)])
        .then(([stop, timetable, routes]) => (
            fetchMaps(stop).then(maps => ({ maps, stop, timetable, routes }))
        ));
}

export {
    fetchStopPosterState, // eslint-disable-line import/prefer-default-export
};
