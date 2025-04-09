import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import withProps from 'recompose/withProps';

import apolloWrapper from 'util/apolloWrapper';
import StopRoutePlate from './stopRoutePlate';
import { forEach, isEqual, xorWith, find } from 'lodash';

const stopRoutePlateQuery = gql`
  query stopRoutePlateQuery($stopIds: [String!], $dateBegin: Date!, $dateEnd: Date!) {
    stops: getStopsByIds(stopIds: $stopIds) {
      nodes {
        stopId
        nameFi
        addressFi
        shortId
        posterCount
        stopType
        stopZone
        lat
        lon
        distributionArea
        distributionOrder
        stopTariff
        modes {
          nodes
        }
        routePlateDateBegin: routeSegmentsForDate(date: $dateBegin) {
          nodes {
            routeId
            pickupDropoffType
            destinationFi
            destinationSe
            viaFi
            viaSe
            hasRegularDayDepartures
            line {
              nodes {
                nameFi
                nameSe
                destinationFi
                destinationSe
                lineId
                lineIdParsed
                trunkRoute
              }
            }
          }
        }
        routePlateDateEnd: routeSegmentsForDate(date: $dateEnd) {
          nodes {
            routeId
            pickupDropoffType
            destinationFi
            destinationSe
            viaFi
            viaSe
            hasRegularDayDepartures
            line {
              nodes {
                nameFi
                nameSe
                destinationFi
                destinationSe
                lineId
                lineIdParsed
                trunkRoute
              }
            }
          }
        }
      }
    }
  }
`;

const compareWithoutWhitespace = (a, b) => {
  const whitespaceRemovedA = a.replace(/\s+/g, '');
  const whitespaceRemovedB = b.replace(/\s+/g, '');
  return whitespaceRemovedA === whitespaceRemovedB;
};

const compareSimilarRoutes = (routeA, routeB) => {
  // Filters out negligible changes to route information like adding extra whitespace
  let isSameRoute = true;
  if (routeA.routeId !== routeB.routeId) isSameRoute = false;
  if (routeA.line?.nodes[0].destinationFi !== routeB.line?.nodes[0].destinationFi) {
    const isSameWithoutWhitespace = compareWithoutWhitespace(
      routeA.line?.[0].destinationFi,
      routeB.line?.[0].destinationFi,
    );
    if (!isSameWithoutWhitespace) isSameRoute = false;
  }
  if (routeA.viaFi !== routeB.viaFi) {
    if (!compareWithoutWhitespace(routeA.viaFi, routeB.viaFi)) isSameRoute = false;
  }
  if (routeA.viaSe !== routeB.viaSe) {
    if (!compareWithoutWhitespace(routeA.viaFi, routeB.viaFi)) isSameRoute = false;
  }

  return isSameRoute;
};

const checkStopRoutesForChanges = stop => {
  const dateBeginRoutes = stop.routePlateDateBegin.nodes;
  const dateEndRoutes = stop.routePlateDateEnd.nodes;

  if (dateBeginRoutes.length === 0 || dateEndRoutes.length === 0) {
    console.log(
      `Cannot compare route differences on stop ${stop.nameFi} due to zero routes on one of the dates`,
    );
    return [];
  }

  const allRouteDifferences = xorWith(dateBeginRoutes, dateEndRoutes, isEqual);

  const mappedRouteDifferences = allRouteDifferences.map(routeDiff => {
    let isRemoved = null;
    let isAdded = null;
    let isNegligibleChange = false;

    const existsOnBeginningDateRoutes = find(dateBeginRoutes, dateBeginRoute => {
      return isEqual(dateBeginRoute, routeDiff);
    });
    const existsOnEndingDateRoutes = find(dateEndRoutes, dateEndRoute => {
      return isEqual(dateEndRoute, routeDiff);
    });

    const dateBeginShallowSearchResult = find(dateBeginRoutes, dateBeginRoute => {
      return dateBeginRoute.routeId === routeDiff.routeId;
    });

    const dateEndShallowSearchResult = find(dateEndRoutes, dateEndRoute => {
      return dateEndRoute.routeId === routeDiff.routeId;
    });

    if (dateBeginShallowSearchResult && dateEndShallowSearchResult) {
      // Same routeId exists on both days, so change must be inside the route properties.
      isNegligibleChange = !compareSimilarRoutes(
        dateBeginShallowSearchResult,
        dateEndShallowSearchResult,
      );
    }

    isRemoved = existsOnBeginningDateRoutes && existsOnEndingDateRoutes === undefined;
    isAdded = existsOnEndingDateRoutes && existsOnBeginningDateRoutes === undefined;

    return {
      ...routeDiff,
      isAdded,
      isRemoved,
      isNegligibleChange,
    };
  });

  console.log(mappedRouteDifferences);

  return allRouteDifferences;
};

const propsMapper = withProps(props => {
  const stops = props.data.stops.nodes;
  const routeDiffs = [];
  forEach(stops, stop => {
    const differences = checkStopRoutesForChanges(stop);
    if (differences.length > 0) {
      routeDiffs.push({ stop, routeChanges: differences });
    }
  });
  return {
    stops,
    routeDiffs,
  };
});

const hoc = compose(graphql(stopRoutePlateQuery), apolloWrapper(propsMapper));
const StopRoutePlateContainer = hoc(StopRoutePlate);

export default StopRoutePlateContainer;
