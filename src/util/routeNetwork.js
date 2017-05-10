/* eslint-disable import/prefer-default-export */
import { gql } from "react-apollo";
import { PerspectiveMercatorViewport } from "viewport-mercator-project";
import { trimRouteId } from "util/domain";

const routeMapper = route => ({
    ...route,
    properties: {
        ...route.properties,
        shortName: trimRouteId(route.properties.route_id),
    },
});

const ferryFilter = route =>
    route.properties.mode !== "FERRY"
    || route.properties.direction === "1";

const networkQuery = gql`
    query networkQuery($minLat: Float!, $minLon: Float!, $maxLat: Float!, $maxLon: Float!, $date: Date!) {
        network: networkByDateAsGeojson(date: $date, minLat: $minLat, minLon: $minLon, maxLat: $maxLat, maxLon: $maxLon)
    }
`;

const NETWORK_PADDING = 1000; // Padding in pixels

export function addRoutesToStyle(options, mapStyle, query, date) {
    const { center, width, height, zoom } = options;

    const viewport = new PerspectiveMercatorViewport({
        longitude: center[0],
        latitude: center[1],
        width,
        height,
        zoom,
    });

    const [minLon, minLat] = viewport.unproject([-NETWORK_PADDING, -NETWORK_PADDING]);
    const [maxLon, maxLat] = viewport.unproject([
        width + NETWORK_PADDING,
        height + NETWORK_PADDING,
    ]);

    return query({
        query: networkQuery,
        variables: { minLat, minLon, maxLat, maxLon, date },
    }).then(({ data }) => {
        // eslint-disable-next-line no-param-reassign
        mapStyle.sources.routes = {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: data.network.features.filter(ferryFilter).map(routeMapper),
            },
        };
        return mapStyle;
    });
}
