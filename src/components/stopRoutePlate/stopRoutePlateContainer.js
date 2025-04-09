import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import withProps from 'recompose/withProps';

import apolloWrapper from 'util/apolloWrapper';
import StopRoutePlate from './stopRoutePlate';
import { xor, uniqWith, forEach, isEqual, xorWith } from 'lodash';

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
const strCompareWithoutWhitespace = (a, b) => {
  const whitespaceRemovedA = a.replace(/\s+/g, '');
  const whitespaceRemovedB = b.replace(/\s+/g, '');
  return whitespaceRemovedA === whitespaceRemovedB;
};

const compareRoutes = (routeA, routeB) => {
  let isSameRoute = true;
  console.log(routeA);
  console.log(routeB);
  if (routeA.routeId !== routeB.routeId) isSameRoute = false;
  if (routeA.line?.nodes[0].destinationFi !== routeB.line?.nodes[0].destinationFi) {
    const isSameWithoutWhitespace = strCompareWithoutWhitespace(
      routeA.line?.[0].destinationFi,
      routeB.line?.[0].destinationFi,
    );
    if (!isSameWithoutWhitespace) isSameRoute = false;
  }
  if (routeA.viaFi !== routeB.viaFi) isSameRoute = false;
  if (routeA.viaSe !== routeB.viaSe) isSameRoute = false;

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

  const routeDifferences = xorWith(dateBeginRoutes, dateEndRoutes, isEqual);
  return routeDifferences;
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
