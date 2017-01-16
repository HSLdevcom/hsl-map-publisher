import viewportMercator from "viewport-mercator-project";
import turf from "turf";
import uniqBy from "lodash/uniqBy";
import { fetchMap, fetchRoute } from "util/api";

// Routes by road segments
const SRC_URL = "http://data.hslhrt.opendata.arcgis.com/datasets/27b68252764f4d7b8ec040ff44481dbe_0.geojson";

function getCentroids(features) {
    return features.map((feature) => {
        let centroid;
        if (feature.geometry.type === "LineString") {
            const length = turf.lineDistance(feature, "kilometers");
            centroid = turf.along(feature, length / 2, "kilometers");
        } else {
            centroid = turf.centroid(feature);
        }
        return { ...feature, geometry: centroid.geometry };
    });
}

function centroidsToLabels(features, viewport) {
    return features
        .filter(({ geometry }) => viewport.contains(geometry.coordinates))
        .map(({ geometry, properties }) => {
            const [left, top] = viewport.project(geometry.coordinates);
            const { routes } = properties;
            return { left, top, routes };
        });
}

function createPaths(features, viewport) {
    const coordinateArrays = features.reduce((prev, feature) => {
        if (feature.geometry.type === "MultiLineString") {
            // Flatten multi lines to simple geometries
            return [...prev, ...feature.geometry.coordinates];
        }
        return [...prev, feature.geometry.coordinates];
    });

    return coordinateArrays.map((coordinates) => {
        const positions = coordinates
            .map(lonlat => viewport.project(lonlat))
            .map(([x, y]) => `${x},${y}`);
        return `M ${positions.join(" ")}`;
    });
}

function getVisibleFeatures(features, filter) {
    return features.reduce((prev, feature) => {
        const intersection = turf.intersect(filter.bbox, feature);
        const routes = feature.properties.REITTILIST.split(",").filter((shortId) => {
            // FIXME: Use full route ids directly when available in properties
            const routeId = `1${shortId.length < 2 ? "0" : ""}${shortId.length < 3 ? "0" : ""}${shortId}`; // eslint-disable-line
            return filter.routesIds.includes(routeId);
        });

        if (intersection && routes.length) {
            const featureToAdd = {
                ...feature,
                geometry: intersection.geometry,
                properties: { routes },
            };
            return [...prev, featureToAdd];
        }
        return prev;
    });
}

function stopsToPixelPositions(stops, viewport) {
    return stops
        .filter(({ lon, lat }) => viewport.contains([lon, lat]))
        .map(({ lon, lat }) => {
            const [left, top] = viewport.project([lon, lat]);
            return { left, top };
        });
}

function routesToStopList(routes) {
    const stops = routes
        .map(route => route.stops)
        .reduce((prev, cur) => [...prev, ...cur]);
    return uniqBy(stops, "stopId");
}

function fetchStops(viewport, filter) {
    return Promise
        .all(filter.routesIds.map(routeId => fetchRoute(routeId)))
        .then(routes => stopsToPixelPositions(routesToStopList(routes), viewport));
}

function fetchRoutes(viewport, filter) {
    return fetch(SRC_URL)
        .then(response => response.json())
        .then(({ features }) => getVisibleFeatures(features, filter))
        .then(features => ({
            labels: centroidsToLabels(getCentroids(features), viewport),
            paths: createPaths(features, viewport),
        }));
}

/**
 * Fetches data for RouteMap component
 * @param {String[]} routesIds - Route ids to show
 * @param {Object} options - Options to post to image generator API
 * @returns {Promise.<Object>}
 */
function fetchRouteMapProps(routesIds, options) {
    const viewport = viewportMercator({
        width: options.width,
        height: options.height,
        longitude: options.center[0],
        latitude: options.center[1],
        zoom: options.zoom,
    });

    const filter = {
        routesIds,
        bbox: turf.bboxPolygon([
            ...viewport.unproject([options.width, options.height]),
            ...viewport.unproject([0, 0]),
        ]),
    };

    return Promise
        .all([fetchMap(options), fetchRoutes(viewport, filter), fetchStops(viewport, filter)])
        .then(([image, routes, stops]) => ({ image, ...routes, stops, options }));
}

export {
    fetchRouteMapProps, // eslint-disable-line import/prefer-default-export
};
