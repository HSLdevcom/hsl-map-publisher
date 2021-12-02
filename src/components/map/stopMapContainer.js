import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import mapProps from 'recompose/mapProps';
import compose from 'recompose/compose';
import flatMap from 'lodash/flatMap';
import get from 'lodash/get';
import { PerspectiveMercatorViewport } from 'viewport-mercator-project';

import apolloWrapper from 'util/apolloWrapper';
import { isNumberVariant, trimRouteId, isDropOffOnly } from 'util/domain';
import { calculateStopsViewport } from 'util/stopPoster';
import routeCompare from 'util/routeCompare';

import StopMap from './stopMap';
import { mergeRouteSegments } from '../../util/mergeRouteSegments';

const MAX_ZOOM = 17.5;
const MIN_ZOOM = 14.5;

const MINI_MAP_WIDTH = 450;
const MINI_MAP_HEIGHT = 360;
const MINI_MAP_ZOOM = 9;

// Mini map position
const MINI_MAP_MARGIN_RIGHT = 60;
const MINI_MAP_MARGIN_BOTTOM = -40;

const nearbyItemsQuery = gql`
  query nearbyItemsQuery(
    $minInterestLat: Float!
    $minInterestLon: Float!
    $maxInterestLat: Float!
    $maxInterestLon: Float!
    $date: Date!
  ) {
    stopGroups: stopGroupedByShortIdByBbox(
      minLat: $minInterestLat
      minLon: $minInterestLon
      maxLat: $maxInterestLat
      maxLon: $maxInterestLon
    ) {
      nodes {
        stopIds
        shortId
        lat
        lon
        nameFi
        nameSe
        stops {
          nodes {
            calculatedHeading
            platform
            routeSegments: routeSegmentsForDate(date: $date) {
              nodes {
                routeId
                hasRegularDayDepartures(date: $date)
                pickupDropoffType
                viaFi
                viaSe
                stopIndex
                route {
                  nodes {
                    destinationFi
                    destinationSe
                    mode
                    routeSegments {
                      nodes {
                        destinationFi
                        destinationSe
                        viaFi
                        viaSe
                        stopId
                        stopIndex
                      }
                    }
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
      .map(routeSegment => {
        const mergedRouteSegment = mergeRouteSegments(
          routeSegment,
          get(routeSegment, 'route.nodes[0].routeSegments.nodes', []),
        );

        const destinationFi = mergedRouteSegment.destinationFi
          ? mergedRouteSegment.destinationFi
          : get(mergedRouteSegment, 'route.nodes[0].destinationFi');

        const destinationSe = mergedRouteSegment.destinationSe
          ? mergedRouteSegment.destinationSe
          : get(mergedRouteSegment, 'route.nodes[0].destinationSe');

        return {
          routeId: trimRouteId(mergedRouteSegment.routeId),
          destinationFi,
          destinationSe,
          viaFi: mergedRouteSegment.viaFi,
          viaSe: mergedRouteSegment.viaSe,
          mode: mergedRouteSegment.route.nodes[0].mode,
        };
      }),
  ).sort(routeCompare),
});

const nearbyItemsMapper = mapProps(props => {
  const stops = props.data.stopGroups.nodes
    // Merge properties from mode-specific stops
    .map(stopsMapper)
    // Filter out stops with no departures
    .filter(stop => !!stop.routes.length);

  const {
    projectedStops,
    viewport,
    projectedCurrentLocation,
    minLon,
    minLat,
    maxLon,
    maxLat,
    projectedSymbols,
  } = calculateStopsViewport({
    longitude: props.longitude,
    latitude: props.latitude,
    width: props.width,
    height: props.height,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    stops,
    currentStopId: props.stopId,
    miniMapStartX: props.width - MINI_MAP_WIDTH - MINI_MAP_MARGIN_RIGHT,
    miniMapStartY: props.height - MINI_MAP_HEIGHT - MINI_MAP_MARGIN_BOTTOM,
    useProjectedSymbols: props.mapZoneSymbols,
  });

  const currentStop = projectedStops.find(({ stopIds }) => stopIds.includes(props.stopId));
  const nearbyStops = projectedStops.filter(({ stopIds }) => !stopIds.includes(props.stopId));

  const mapOptions = {
    center: [viewport.longitude, viewport.latitude],
    width: props.width,
    height: props.height,
    zoom: viewport.zoom,
    mapZoneSymbols: props.mapZoneSymbols,
    mapZones: props.mapZones,
  };

  const miniMapOptions = {
    center: [props.longitude, props.latitude],
    width: MINI_MAP_WIDTH,
    height: MINI_MAP_HEIGHT,
    zoom: MINI_MAP_ZOOM,
    marginRight: MINI_MAP_MARGIN_RIGHT,
    marginBottom: MINI_MAP_MARGIN_BOTTOM,
    minimapZoneSymbols: props.minimapZoneSymbols,
    minimapZones: props.minimapZones,
  };

  return {
    ...props,
    currentStop: {
      ...currentStop,
      x: projectedCurrentLocation.x,
      y: projectedCurrentLocation.y,
    },
    nearbyStops,
    pixelsPerMeter: viewport.getDistanceScales().pixelsPerMeter[0],
    mapOptions,
    miniMapOptions,
    minLon,
    minLat,
    maxLon,
    maxLat,
    projectedSymbols,
  };
});

const mapPositionQuery = gql`
  query mapPositionQuery($stopId: String!) {
    stop: stopByStopId(stopId: $stopId) {
      stopId
      lat
      lon
      platform
    }
  }
`;

const mapInterestsMapper = mapProps(props => {
  const longitude = props.data.stop.lon;
  const latitude = props.data.stop.lat;
  const { platform } = props.data.stop;

  const maxDimensionsForInterests = {
    height: props.height * 2,
    width: props.width * 2,
  };

  const viewport = new PerspectiveMercatorViewport({
    longitude,
    latitude,
    width: maxDimensionsForInterests.width,
    height: maxDimensionsForInterests.height,
    zoom: MIN_ZOOM,
  });
  const [minInterestLon, minInterestLat] = viewport.unproject([0, 0]);
  const [maxInterestLon, maxInterestLat] = viewport.unproject([
    maxDimensionsForInterests.width,
    maxDimensionsForInterests.height,
  ]);
  return {
    ...props,
    longitude,
    latitude,
    platform,
    minInterestLat,
    minInterestLon,
    maxInterestLat,
    maxInterestLon,
  };
});

const hoc = compose(
  graphql(mapPositionQuery),
  apolloWrapper(mapInterestsMapper),
  graphql(nearbyItemsQuery),
  apolloWrapper(nearbyItemsMapper),
);

const StopMapContainer = hoc(StopMap);

StopMapContainer.propTypes = {
  stopId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default StopMapContainer;
