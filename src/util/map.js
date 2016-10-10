
function featureCollection(features) {
    return {
        type: "FeatureCollection",
        features,
    };
}

function feature(lat, lon) {
    return {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [lat, lon],
        },
        properties: {},
    };
}

/**
 * Creates Mapbox GL style source and layer definitions for given stops
 * @param {Array} activeStops - Stops to highlight (optional)
 * @param {Array} stops - Normal stops (optional)
 * @returns {Object} - Partial style containing sources and layers for stops
 */
function createStopStyle(activeStops = [], stops = []) {
    return {
        sources: {
            activeStops: {
                type: "geojson",
                data: featureCollection(activeStops.map(stop => feature(stop.lat, stop.lon))),
            },
            stops: {
                type: "geojson",
                data: featureCollection(stops.map(stop => feature(stop.lat, stop.lon))),
            },
        },
        layers: [
            {
                id: "activeStops",
                type: "circle",
                source: "activeStops",
                paint: {
                    "circle-color": "hsl(342, 78%, 48%)",
                    "circle-radius": {
                        stops: [[8, 10], [14, 22]],
                    },
                },
            },
            {
                id: "stops-border",
                type: "circle",
                source: "stops",
                paint: {
                    "circle-color": "hsl(200, 100%, 40%)",
                    "circle-radius": 18,
                },
            },
            {
                id: "stops",
                type: "circle",
                source: "stops",
                paint: {
                    "circle-color": "rgb(255, 255, 255)",
                    "circle-radius": 13,
                },
            },
            {
                id: "stops-inner",
                type: "circle",
                source: "stops",
                paint: {
                    "circle-color": "hsl(200, 100%, 40%)",
                    "circle-radius": 8,
                },
            },
        ],
    };
}

export {
    createStopStyle, // eslint-disable-line import/prefer-default-export
};
