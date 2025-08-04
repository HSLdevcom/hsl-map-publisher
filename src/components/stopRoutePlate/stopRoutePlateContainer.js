import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import withProps from 'recompose/withProps';

import apolloWrapper from 'util/apolloWrapper';
import StopRoutePlate from './stopRoutePlate';
import { forEach, isEqual, xorWith, find, differenceWith, findIndex, uniqBy } from 'lodash';
import {
  getFormattedRouteList,
  formatRouteString,
  filterRoute,
  isNumberVariant,
  getShelterText,
  trimRouteId,
} from 'util/domain';

const stopRoutePlateQuery = gql`
  query stopRoutePlateQuery($stopIds: [String!], $dateBegin: Date!, $dateEnd: Date!) {
    stops: getStopsByIds(stopIds: $stopIds) {
      nodes {
        stopId
        nameFi
        nameSe
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
            plateViaFi
            plateViaSe
            hasRegularDayDepartures
            dateBegin
            dateEnd
            route {
              nodes {
                destinationFi
                destinationSe
                mode
              }
            }
          }
        }
        routePlateDateEnd: routeSegmentsForDate(date: $dateEnd) {
          nodes {
            routeId
            pickupDropoffType
            plateViaFi
            plateViaSe
            hasRegularDayDepartures
            dateBegin
            dateEnd
            route {
              nodes {
                destinationFi
                destinationSe
                mode
              }
            }
          }
        }
      }
    }
  }
`;

// This is for the line query (linjahaku) version of the stopRoutePlate query
const lineQueryStopRoutePlateQuery = gql`
  query stopRoutePlateLineQuery($lineId: String!, $dateBegin: Date!, $dateEnd: Date!) {
    lines: getLinesWithIdAndUserDateRange(
      id: $lineId
      lineDateBegin: $dateBegin
      lineDateEnd: $dateEnd
    ) {
      nodes {
        lineId
        lineIdParsed
        destinationFi
        destinationSe
        dateBegin
        dateEnd
        trunkRoute
        routes: routesForDateRange(routeDateBegin: $dateBegin, routeDateEnd: $dateEnd) {
          nodes {
            routeId
            direction
            dateBegin
            dateEnd
            mode
            routeSegments {
              nodes {
                pickupDropoffType
                destinationFi
                destinationSe
                plateViaFi
                plateViaSe
                dateImported
                hasRegularDayDepartures
                stopByStopId {
                  stopId
                  nameFi
                  nameSe
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
                      plateViaFi
                      plateViaSe
                      hasRegularDayDepartures
                      dateBegin
                      dateEnd
                      route {
                        nodes {
                          destinationFi
                          destinationSe
                          mode
                        }
                      }
                    }
                  }
                  routePlateDateEnd: routeSegmentsForDate(date: $dateEnd) {
                    nodes {
                      routeId
                      pickupDropoffType
                      plateViaFi
                      plateViaSe
                      hasRegularDayDepartures
                      dateBegin
                      dateEnd
                      route {
                        nodes {
                          destinationFi
                          destinationSe
                          mode
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
  }
`;

const compareWithoutWhitespace = (a, b) => {
  try {
    const whitespaceRemovedA = a.replace(/\s+/g, '');
    const whitespaceRemovedB = b.replace(/\s+/g, '');
    return whitespaceRemovedA === whitespaceRemovedB;
  } catch {
    return false;
  }
};

const compareSimilarRoutes = (routeA, routeB) => {
  // Filters out negligible changes to route information like adding extra whitespace
  let isSameRoute = true;
  if (routeA.routeId !== routeB.routeId) isSameRoute = false;
  if (routeA.route?.nodes[0].destinationFi !== routeB.route?.nodes[0].destinationFi) {
    const isSameWithoutWhitespace = compareWithoutWhitespace(
      routeA.route?.nodes[0].destinationFi,
      routeB.route?.nodes[0].destinationFi,
    );
    if (!isSameWithoutWhitespace) isSameRoute = false;
  }
  if (routeA.route?.nodes[0].destinationSe !== routeB.route?.nodes[0].destinationSe) {
    const isSameWithoutWhitespace = compareWithoutWhitespace(
      routeA.route?.nodes[0].destinationSe,
      routeB.route?.nodes[0].destinationSe,
    );
    if (!isSameWithoutWhitespace) isSameRoute = false;
  }
  if (routeA.plateViaFi !== routeB.plateViaFi) {
    if (!compareWithoutWhitespace(routeA.plateViaFi, routeB.plateViaFi)) isSameRoute = false;
  }
  if (routeA.plateViaSe !== routeB.plateViaSe) {
    if (!compareWithoutWhitespace(routeA.plateViaSe, routeB.plateViaSe)) isSameRoute = false;
  }

  return isSameRoute;
};

const checkStopRouteChanges = stop => {
  const dateBeginRoutes = stop.routePlateDateBegin;
  const dateEndRoutes = stop.routePlateDateEnd;

  const allRouteDifferences = xorWith(dateBeginRoutes, dateEndRoutes, isEqual);

  const mappedRouteDifferences = allRouteDifferences.map(routeDiff => {
    let isRemoved = null;
    let isAdded = null;
    let isNegligibleChange = false;
    let changeDate = null;

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
      isNegligibleChange = compareSimilarRoutes(
        dateBeginShallowSearchResult,
        dateEndShallowSearchResult,
      );
    }

    isRemoved = existsOnBeginningDateRoutes && existsOnEndingDateRoutes === undefined;
    isAdded = existsOnEndingDateRoutes && existsOnBeginningDateRoutes === undefined;

    if (isRemoved) {
      changeDate = existsOnBeginningDateRoutes.dateEnd;
    }

    if (isAdded) {
      changeDate = existsOnEndingDateRoutes.dateBegin;
    }

    return {
      ...routeDiff,
      isAdded,
      isRemoved,
      isNegligibleChange,
      changeDate,
    };
  });

  const getFormattedChangeDateForStop = (addedRoutes, removedRoutes) => {
    try {
      const sortedChangeDates = [...addedRoutes, ...removedRoutes].sort((a, b) => {
        return Date.parse(a.changeDate) > Date.parse(b.changeDate);
      });
      return `${sortedChangeDates[0].changeDate}`;
    } catch {
      return '';
    }
  };

  const addedRoutes = mappedRouteDifferences
    .filter(diff => !diff.isNegligibleChange)
    .filter(diff => diff.isAdded);
  const removedRoutes = mappedRouteDifferences
    .filter(diff => !diff.isNegligibleChange)
    .filter(diff => diff.isRemoved);

  const unchangedRoutes = differenceWith(dateBeginRoutes, dateEndRoutes);

  const formattedAddedRoutes = getFormattedRouteList(addedRoutes);
  const formattedRemovedRoutes = getFormattedRouteList(removedRoutes);
  const formattedUnchangedRoutes = getFormattedRouteList(unchangedRoutes);
  const formattedEndDateRoutes = getFormattedRouteList(dateEndRoutes);
  const formattedEarliestChangeDate = getFormattedChangeDateForStop(addedRoutes, removedRoutes);

  return {
    addedRoutes,
    removedRoutes,
    unchangedRoutes,
    formatted: {
      added: formattedAddedRoutes,
      removed: formattedRemovedRoutes,
      unchanged: formattedUnchangedRoutes,
      endResult: formattedEndDateRoutes,
      earliestChangeDate: formattedEarliestChangeDate,
    },
  };
};

const getMapsLink = (lat, lon) => `https://www.google.com/maps/place/${lat},${lon}`;

const deepCompareRoutePlates = (a, b) => {
  const aRoute = a.route?.nodes[0];
  const bRoute = b.route?.nodes[0];
  return (
    a.routeId === b.routeId &&
    a.plateViaFi === b.plateViaFi &&
    a.plateViaSe === b.plateViaSe &&
    aRoute.destinationFi === bRoute.destinationFi &&
    aRoute.destinationSe === bRoute.destinationSe
  );
};

const propsMapper = withProps(props => {
  const stops = props.data.stops.nodes;

  const filteredStops = stops.map(stop => {
    return {
      ...stop,
      stopType: getShelterText(stop.stopType),
      routePlateDateBegin: stop.routePlateDateBegin.nodes
        .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
        .filter(routeSegment => {
          return filterRoute({ routeId: routeSegment.routeId, filter: props.routeFilter });
        }),
      routePlateDateEnd: stop.routePlateDateEnd.nodes
        .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
        .filter(routeSegment => {
          return filterRoute({ routeId: routeSegment.routeId, filter: props.routeFilter });
        }),
    };
  });

  const routeDiffs = [];
  forEach(filteredStops, stop => {
    const differences = checkStopRouteChanges(stop);
    routeDiffs.push({
      stop: {
        ...stop,
        latLon: `${stop.lat}, ${stop.lon}`,
        linkToLocation: getMapsLink(stop.lat, stop.lon),
      },
      routeChanges: differences,
    });
  });

  const allPlates = [];

  forEach(routeDiffs, diff => {
    const { routeChanges } = diff;
    if (routeChanges.addedRoutes.length > 0) {
      allPlates.push(...routeChanges.addedRoutes);
    }
    if (routeChanges.removedRoutes.length > 0) {
      allPlates.push(...routeChanges.removedRoutes);
    }
  });

  const groupedRoutePlates = [];

  forEach(allPlates, plate => {
    const plateAlreadyExists = findIndex(groupedRoutePlates, uniquePlate => {
      return deepCompareRoutePlates(plate, uniquePlate);
    });
    if (plateAlreadyExists === -1) {
      if (plate.isAdded && !plate.isNegligibleChange)
        groupedRoutePlates.push({ ...plate, totalAmount: -1, removed: 0, added: 1 });
      if (plate.isRemoved && !plate.isNegligibleChange)
        groupedRoutePlates.push({ ...plate, totalAmount: 1, removed: 1, added: 0 });
    } else {
      if (groupedRoutePlates[plateAlreadyExists]?.isAdded) {
        groupedRoutePlates[plateAlreadyExists].totalAmount--;
        groupedRoutePlates[plateAlreadyExists].added++;
      }
      if (groupedRoutePlates[plateAlreadyExists]?.isRemoved) {
        groupedRoutePlates[plateAlreadyExists].totalAmount++;
        groupedRoutePlates[plateAlreadyExists].removed++;
      }
    }
  });

  const routePlateSummary = groupedRoutePlates.map(plate => {
    return {
      comparisonDateRange: `${props.dateBegin} - ${props.dateEnd}`,
      plateText: formatRouteString(plate),
      amountRemoved: plate.removed,
      amountAdded: plate.added,
      totalAmount: plate.totalAmount,
      amountNeeded: plate.totalAmount > 0 ? 0 : plate.removed + plate.added,
    };
  });

  return {
    routeDiffs,
    csvFileName: props.csvFileName,
    routePlateSummary,
  };
});

const lineQueryPropsMapper = withProps(props => {
  const allRoutes = props.data.lines?.nodes[0].routes?.nodes;

  const stops = allRoutes.flatMap(route => {
    return route.routeSegments.nodes.map(routeSegment => {
      return { ...routeSegment.stopByStopId, queriedRouteIdParsed: trimRouteId(route.routeId) };
    });
  });

  const uniqueStops = uniqBy(stops, 'stopId');

  const filteredStops = uniqueStops.map(stop => {
    return {
      ...stop,
      stopType: getShelterText(stop.stopType),
      routePlateDateBegin: stop.routePlateDateBegin.nodes
        .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
        .filter(routeSegment => {
          return filterRoute({ routeId: routeSegment.routeId, filter: props.routeFilter });
        }),
      routePlateDateEnd: stop.routePlateDateEnd.nodes
        .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
        .filter(routeSegment => {
          return filterRoute({ routeId: routeSegment.routeId, filter: props.routeFilter });
        }),
    };
  });

  const routeDiffs = [];
  forEach(filteredStops, stop => {
    const differences = checkStopRouteChanges(stop);
    routeDiffs.push({
      stop: {
        ...stop,
        latLon: `${stop.lat}, ${stop.lon}`,
        linkToLocation: getMapsLink(stop.lat, stop.lon),
      },
      routeChanges: differences,
    });
  });

  const allPlates = [];

  forEach(routeDiffs, diff => {
    const { routeChanges } = diff;
    if (routeChanges.addedRoutes.length > 0) {
      allPlates.push(...routeChanges.addedRoutes);
    }
    if (routeChanges.removedRoutes.length > 0) {
      allPlates.push(...routeChanges.removedRoutes);
    }
  });

  const groupedRoutePlates = [];

  forEach(allPlates, plate => {
    const plateAlreadyExists = findIndex(groupedRoutePlates, uniquePlate => {
      return deepCompareRoutePlates(plate, uniquePlate);
    });
    if (plateAlreadyExists === -1) {
      if (plate.isAdded && !plate.isNegligibleChange)
        groupedRoutePlates.push({ ...plate, totalAmount: -1, removed: 0, added: 1 });
      if (plate.isRemoved && !plate.isNegligibleChange)
        groupedRoutePlates.push({ ...plate, totalAmount: 1, removed: 1, added: 0 });
    } else {
      if (groupedRoutePlates[plateAlreadyExists]?.isAdded) {
        groupedRoutePlates[plateAlreadyExists].totalAmount--;
        groupedRoutePlates[plateAlreadyExists].added++;
      }
      if (groupedRoutePlates[plateAlreadyExists]?.isRemoved) {
        groupedRoutePlates[plateAlreadyExists].totalAmount++;
        groupedRoutePlates[plateAlreadyExists].removed++;
      }
    }
  });

  const routePlateSummary = groupedRoutePlates.map(plate => {
    return {
      comparisonDateRange: `${props.dateBegin} - ${props.dateEnd}`,
      plateText: formatRouteString(plate),
      amountRemoved: plate.removed,
      amountAdded: plate.added,
      totalAmount: plate.totalAmount,
      amountNeeded: plate.totalAmount > 0 ? 0 : plate.removed + plate.added,
    };
  });

  return {
    routeDiffs,
    csvFileName: props.csvFileName,
    routePlateSummary,
    usesLineQuery: true,
  };
});

const hoc = compose(graphql(stopRoutePlateQuery), apolloWrapper(propsMapper));
const lineQueryHoc = compose(
  graphql(lineQueryStopRoutePlateQuery),
  apolloWrapper(lineQueryPropsMapper),
);
const StopRoutePlateContainer = hoc(StopRoutePlate);
const LineQueryStopRoutePlateContainer = lineQueryHoc(StopRoutePlate);

export { StopRoutePlateContainer, LineQueryStopRoutePlateContainer };
