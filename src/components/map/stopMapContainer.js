import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import mapProps from 'recompose/mapProps';
import compose from 'recompose/compose';
import flatMap from 'lodash/flatMap';
import get from 'lodash/get';
import { PerspectiveMercatorViewport } from 'viewport-mercator-project';
import haversine from 'haversine';

import apolloWrapper from 'util/apolloWrapper';
import promiseWrapper from 'util/promiseWrapper';
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

const SALE_POINT_TYPES = [
  'Kertalippuautomaatti',
  'Monilippuautomaatti',
  'myyntipiste', // yes, there is one in lowercase
  'Myyntipiste',
];

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
    projectedSalePoints,
  } = calculateStopsViewport({
    longitude: props.longitude,
    latitude: props.latitude,
    width: props.width,
    height: props.height,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    stops,
    salePoints: props.salePoints,
    currentStopId: props.stopId,
    miniMapStartX: props.width - MINI_MAP_WIDTH - MINI_MAP_MARGIN_RIGHT,
    miniMapStartY: props.height - MINI_MAP_HEIGHT - MINI_MAP_MARGIN_BOTTOM,
    useProjectedSymbols: props.mapZoneSymbols,
  });

  const currentStop = projectedStops.find(({ stopIds }) => stopIds.includes(props.stopId));
  const nearbyStops = projectedStops.filter(({ stopIds }) => !stopIds.includes(props.stopId));
  // Calculate distances to sale points and get the nearest one
  const nearestSalePoint = props.salesPoint
    ? projectedSalePoints
        .map(sp => {
          // Euclidean distance
          const distance = haversine(
            { latitude: sp.lat, longitude: sp.lon },
            { latitude: projectedCurrentLocation.lat, longitude: projectedCurrentLocation.lon },
            { unit: 'meter' },
          );
          return { ...sp, distance };
        })
        .reduce((prev, curr) => (prev && curr.distance > prev.distance ? prev : curr), null)
    : null;

  const projectedSalesPoints = [];
  props.salePoints.forEach(salePoint => {
    if (
      salePoint.lon > minLon &&
      salePoint.lon < maxLon &&
      salePoint.lat < minLat &&
      salePoint.lat > maxLat
    ) {
      projectedSalesPoints.push(salePoint);
    }
  });

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
    nearestSalePoint,
    projectedSalesPoints,
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

const getSalePoints = async () => {
  const response = await fetch(process.env.SALES_POINT_DATA_URL, { method: 'GET' });
  const data = await response.json();
  const result = data.features
    .filter(sp => SALE_POINT_TYPES.includes(sp.properties.Tyyppi))
    .map(sp => {
      const { properties } = sp;
      const { coordinates } = sp.geometry;
      const [lon, lat] = coordinates;
      return {
        id: properties.ID,
        type: properties.Tyyppi,
        title: properties.Nimi,
        address: properties.Osoite,
        lat,
        lon,
      };
    });
  return result;
};

const fetchOSMObjects = async props => {
  const osmData = await fetch(
    `https://nominatim.openstreetmap.org/search.php?q=metro&
    viewbox=${props.maxInterestLon}%2C${props.maxInterestLat}%2C${props.minInterestLon}%2C${props.minInterestLat}
    &bounded=1&format=json&namedetails=1`,
  );
  const results = await osmData.json();
  return results;
};

const osmPointsMapper = mapProps(props => {
  const subwayEntrances = fetchOSMObjects(props);
  return {
    ...props,
    subwayEntrances,
  };
});

const salePointsMapper = mapProps(props => {
  // If sales points are not configured, do not fetch them but return empty array
  const salePoints = props.salesPoint || props.legend ? getSalePoints() : Promise.resolve([]);
  return {
    ...props,
    salePoints,
  };
});

const hoc = compose(
  graphql(mapPositionQuery),
  apolloWrapper(mapInterestsMapper),
  graphql(nearbyItemsQuery),
  salePointsMapper,
  promiseWrapper('salePoints'),
  osmPointsMapper,
  promiseWrapper('subwayEntrances'),
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
