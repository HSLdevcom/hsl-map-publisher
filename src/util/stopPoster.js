import { PerspectiveMercatorViewport } from "viewport-mercator-project";

const MAX_STOPS = 8;

const MAX_ZOOM = 18;
export const MIN_ZOOM = 14;
const STEP_ZOOM = 0.1;

export const MAP_WIDTH = 1500;
export const MAP_HEIGHT = 1200;

export function createViewport(stop, zoom) {
    return new PerspectiveMercatorViewport({
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

export function calculateStopsViewport(centeredStop, stops) {
    let viewport;
    let visibleStops = stops.filter(({ stopIds }) => !stopIds.includes(centeredStop.stopId));

    // Increase zoom level until only max number of stops visible
    for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom += STEP_ZOOM) {
        viewport = createViewport(centeredStop, zoom);
        visibleStops = visibleStops.filter(stop => viewportContains(viewport, stop)); // eslint-disable-line
        if (visibleStops.length <= MAX_STOPS) break;
    }

    // Calculate pixel coordinates for each stop
    const projectedStops = visibleStops.map((stop) => {
        const [x, y] = viewport.project([stop.lon, stop.lat]);
        return { ...stop, x, y };
    });

    return { stops: projectedStops, viewport };
}
