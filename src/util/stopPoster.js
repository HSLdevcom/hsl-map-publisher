import { PerspectiveMercatorViewport } from "viewport-mercator-project";

const STOPS_PER_PIXEL = 0.000006;

function viewportContains(viewport, stop) {
    const [x, y] = viewport.project([stop.lon, stop.lat], { topLeft: true });
    return x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height;
}

function calculateStopsViewport(options) {
    const {
        longitude, latitude, width, height, minZoom, maxZoom, stops,
    } = options;
    // Nearby stops with labels plus current stop (no label)
    const maxStops = (width * height * STOPS_PER_PIXEL) + 1;

    let viewport;
    let visibleStops = stops;

    // Increase zoom level until only max number of stops visible
    for (let zoom = minZoom; zoom <= maxZoom; zoom += 0.1) {
        viewport = new PerspectiveMercatorViewport({
            longitude, latitude, width, height, zoom,
        });
        visibleStops = visibleStops.filter(stop => viewportContains(viewport, stop)); // eslint-disable-line
        if (visibleStops.length <= maxStops) break;
    }

    const center = {
        longitude,
        latitude,
    };

    // Calculate pixel coordinates for each stop
    const projectedStops = visibleStops.map((stop) => {
        const [x, y] = viewport.project([stop.lon, stop.lat]);
        return { ...stop, x, y };
    });

    const [minLon, minLat] = viewport.unproject([0, 0]);
    const [maxLon, maxLat] = viewport.unproject([options.width, options.height]);

    const [x, y] = viewport.project([longitude, latitude]);
    const projectedCurrentLocation = {
        x,
        y,
    };

    return {
        projectedStops,
        viewport,
        center,
        projectedCurrentLocation,
        minLon,
        minLat,
        maxLon,
        maxLat,
    };
}

export {
    calculateStopsViewport, // eslint-disable-line import/prefer-default-export
};
