import { PerspectiveMercatorViewport } from "viewport-mercator-project";

const MAX_STOPS = 12;

const MAX_ZOOM = 19;
export const MIN_ZOOM = 14;
const STEP_ZOOM = 0.1;

function viewportContains(viewport, stop) {
    const [x, y] = viewport.project([stop.lon, stop.lat], { topLeft: true });
    return x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height;
}

export function calculateStopsViewport(options) {
    const { longitude, latitude, width, height, stops } = options;

    let viewport;
    let visibleStops = stops;

    // Increase zoom level until only max number of stops visible
    for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom += STEP_ZOOM) {
        viewport = new PerspectiveMercatorViewport({ longitude, latitude, width, height, zoom });
        visibleStops = visibleStops.filter(stop => viewportContains(viewport, stop)); // eslint-disable-line
        if (visibleStops.length <= MAX_STOPS) break;
    }

    // Calculate pixel coordinates for each stop
    const projectedStops = visibleStops.map((stop) => {
        const [x, y] = viewport.project([stop.lon, stop.lat]);
        return { ...stop, x, y };
    });

    return { projectedStops, viewport };
}
