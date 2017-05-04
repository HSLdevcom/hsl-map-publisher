import { PropTypes } from "prop-types";
import { gql, graphql } from "react-apollo";
import mapProps from "recompose/mapProps";
import getContext from "recompose/getContext";
import compose from "recompose/compose";
import flatMap from "lodash/flatMap";
import { PerspectiveMercatorViewport } from "viewport-mercator-project";

import apolloWrapper from "util/apolloWrapper";
import { fetchMap } from "util/api";
import { isNumberVariant, trimRouteId, isDropOffOnly } from "util/domain";
import { MIN_ZOOM, calculateStopsViewport } from "util/stopPoster";
import routeCompare from "util/routeCompare";
import hslMapStyle from "hsl-map-style";

import Map from "./map";

const MINI_MAP_WIDTH = 450;
const MINI_MAP_HEIGHT = 360;
const MINI_MAP_ZOOM = 9;

const nearbyStopsQuery = gql`
    query nearbyStopsQuery($minLat: Float!, $minLon: Float!, $maxLat: Float!, $maxLon: Float!, $date: Date!) {
        stopGroups: stopGroupedByShortIdByBbox(minLat: $minLat, minLon: $minLon, maxLat: $maxLat, maxLon: $maxLon) {
            nodes {
                stopIds
                lat
                lon
                nameFi
                nameSe
                stops {
                    nodes {
                        calculatedHeading
                        routeSegments: routeSegmentsForDate(date: $date) {
                            nodes {
                                routeId
                                hasRegularDayDepartures
                                pickupDropoffType
                                route {
                                    nodes {
                                        destinationFi
                                        destinationSe
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

const stopsMapper = stopGroup => ({
    ...stopGroup,
    // Assume all stops face the same way
    calculatedHeading: stopGroup.stops.nodes[0].calculatedHeading,
    routes: flatMap(stopGroup.stops.nodes, node =>
        node.routeSegments.nodes
            .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
            .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
            .filter(routeSegment => !isDropOffOnly(routeSegment))
            .map(routeSegment => ({
                routeId: trimRouteId(routeSegment.routeId),
                destinationFi: routeSegment.route.nodes[0].destinationFi,
                destinationSe: routeSegment.route.nodes[0].destinationSe,
            }))).sort(routeCompare),
});

const getClient = getContext({
    client: PropTypes.shape({
        query: PropTypes.func.isRequired,
    }).isRequired,
});

const nearbyStopsMapper = compose(getClient, mapProps((props) => {
    const nearbyStops = props.data.stopGroups.nodes
        .filter(({ stopIds }) => !stopIds.includes(props.stopId))
        .map(stopsMapper);

    const { projectedStops, viewport } = calculateStopsViewport({
        longitude: props.longitude,
        latitude: props.latitude,
        width: props.width,
        height: props.height,
        stops: nearbyStops,
    });

    const mapOptions = {
        center: [props.longitude, props.latitude],
        width: props.width,
        height: props.height,
        zoom: viewport.zoom,
    };

    const mapStyle = hslMapStyle.generateStyle({
        lang: ["fi", "sv"],
        extensions: ["icons", "routes", "citybikes"],
        glyphsUrl: "http://kartat.hsl.fi/",
        sourcesUrl: "api.digitransit.fi/map/v1/",
    });

    const networkQuery = gql`
        query networkQuery($minLat: Float!, $minLon: Float!, $maxLat: Float!, $maxLon: Float!, $date: Date!) {
            network: networkByDateAsGeojson(date: $date, minLat: $minLat, minLon: $minLon, maxLat: $maxLat, maxLon: $maxLon)
        }
    `;

    const NETWORK_PADDING = 1000; // Padding in pixels

    const [minLon, minLat] = viewport.unproject([-NETWORK_PADDING, -NETWORK_PADDING]);
    const [maxLon, maxLat] = viewport.unproject([
        props.width + NETWORK_PADDING,
        props.height + NETWORK_PADDING,
    ]);

    const map = props.client.query({
        query: networkQuery,
        variables: { minLat, minLon, maxLat, maxLon, date: props.date },
    }).then(({ data }) => {
        mapStyle.sources.routes = {
            type: "geojson",
            data: data.network,
        };
        return fetchMap(mapOptions, mapStyle);
    });

    const miniMapOptions = {
        center: [props.longitude, props.latitude],
        width: MINI_MAP_WIDTH,
        height: MINI_MAP_HEIGHT,
        zoom: MINI_MAP_ZOOM,
    };

    const miniMap = fetchMap(miniMapOptions);

    return {
        stops: projectedStops,
        pixelsPerMeter: viewport.getDistanceScales().pixelsPerMeter[0],
        map,
        mapOptions,
        miniMap,
        miniMapOptions,
    };
}));

const MapWithNearbyStopsContainer = apolloWrapper(nearbyStopsMapper)(Map);

const MapWithNearbyStops = graphql(nearbyStopsQuery)(MapWithNearbyStopsContainer);

const mapPositionQuery = gql`
    query mapPositionQuery($stopId: String!) {
        stop: stopByStopId(stopId: $stopId) {
            stopId
            lat
            lon
        }
    }
`;

const mapPositionMapper = mapProps((props) => {
    const longitude = props.data.stop.lon;
    const latitude = props.data.stop.lat;
    const viewport = new PerspectiveMercatorViewport({
        longitude,
        latitude,
        width: props.width,
        height: props.height,
        zoom: MIN_ZOOM,
    });
    const [minLon, minLat] = viewport.unproject([0, 0]);
    const [maxLon, maxLat] = viewport.unproject([props.width, props.height]);
    return { ...props, longitude, latitude, minLat, minLon, maxLat, maxLon };
});

const MapContainer = apolloWrapper(mapPositionMapper)(MapWithNearbyStops);

MapContainer.propTypes = {
    stopId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
};

export default graphql(mapPositionQuery)(MapContainer);
