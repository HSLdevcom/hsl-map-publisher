import { PerspectiveMercatorViewport } from "viewport-mercator-project";

const STOPS_PER_PIXEL = 0.000006;
const MAJOR_TRANSPORT_WEIGHT = 50;
const DISTANCE_WEIGHT = 0.1;
const ZOOM_WEIGHT = 1;
const STOP_AMOUNT_WEIGHT = 10000;
const DISTANCES_FROM_CENTRE = [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30];
const ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

function viewportContains(viewport, stop, width, height, miniMapStartX, miniMapStartY) {
    const [x, y] = viewport.project([stop.lon, stop.lat], { topLeft: true });
    const behindMiniMap = x > miniMapStartX && (height - y) > miniMapStartY;
    return x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height && !behindMiniMap;
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function getStopDistanceCost(stop, centerLon, centerLat) {
    return Math.hypot(stop.lon - centerLon, stop.lat - centerLat);
}

function calculateStopsViewport(options) {
    const {
        currentStopId,
        longitude,
        latitude,
        width,
        height,
        minZoom,
        maxZoom,
        stops,
        miniMapStartX,
        miniMapStartY,
    } = options;
    // Nearby stops with labels plus current stop (no label)
    const maxStops = (width * height * STOPS_PER_PIXEL) + 1;

    const zoomLevels = [];
    for (let zoom = minZoom; zoom <= maxZoom; zoom += 0.1) {
        zoomLevels.push(zoom);
    }

    let bestViewPort = null;
    let bestViewPortScore = 0;
    let bestVisibleStops = [];

    const allStops = stops.map(stop => ({
        ...stop,
        major: stop.routes.some(route => route.mode === "SUBWAY" || route.mode === "RAIL"),
    }));

    zoomLevels.forEach((zoom) => {
        const baseViewport = new PerspectiveMercatorViewport({
            longitude, latitude, width, height, zoom,
        });
        DISTANCES_FROM_CENTRE.forEach((centreDistance) => {
            ANGLES.forEach((angle) => {
                const angleInRadian = toRadians(angle);
                const xDiff = Math.cos(angleInRadian) * centreDistance;
                const yDiff = Math.sin(angleInRadian) * centreDistance;
                const x = Math.floor((width / 2) + (xDiff * width));
                const y = Math.floor((height / 2) + (yDiff * height));
                const [lon, lat] = baseViewport.unproject([x, y]);

                const viewport = new PerspectiveMercatorViewport({
                    longitude: lon, latitude: lat, width, height, zoom,
                });

                const visibleStops = allStops.filter(stop =>
                    viewportContains(viewport, stop, width, height, miniMapStartX, miniMapStartY));

                const currentStopIsVisible = visibleStops
                    .some(s => s.stopIds
                        .some(sId => sId === currentStopId));

                if (visibleStops.length <= maxStops && currentStopIsVisible) {
                    const stopDistance = visibleStops
                        .map(stop =>
                            getStopDistanceCost(stop, viewport.longitude, viewport.latitude))
                        .reduce((a, b) => a + b);

                    const visibleMajorStationsPoints = visibleStops
                        .filter(stop => stop.major).length;

                    const zoomPoints = 24 - zoom;

                    let score = visibleStops.length * STOP_AMOUNT_WEIGHT;
                    score += zoomPoints * ZOOM_WEIGHT;
                    score += visibleMajorStationsPoints * MAJOR_TRANSPORT_WEIGHT;
                    score += (1 / (stopDistance / visibleStops.length)) * DISTANCE_WEIGHT;

                    if (score > bestViewPortScore) {
                        bestViewPortScore = score;
                        bestViewPort = viewport;
                        bestVisibleStops = visibleStops;
                    }
                }
            });
        });
    });

    // Calculate pixel coordinates for each stop
    const projectedStops = bestVisibleStops.map((stop) => {
        const [x, y] = bestViewPort.project([stop.lon, stop.lat]);
        return { ...stop, x, y };
    });

    const [minLon, minLat] = bestViewPort.unproject([0, 0]);

    const [maxLon, maxLat] = bestViewPort.unproject([options.width, options.height]);


    const [x, y] = bestViewPort.project([longitude, latitude]);
    const projectedCurrentLocation = {
        x,
        y,
    };

    return {
        projectedStops,
        viewport: bestViewPort,
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
