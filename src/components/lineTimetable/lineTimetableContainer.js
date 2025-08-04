/* eslint-disable no-undef */
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import mapProps from 'recompose/mapProps';
import compose from 'recompose/compose';
import { filter, forEach, isEmpty, uniqBy, uniqWith } from 'lodash';

import apolloWrapper from 'util/apolloWrapper';

import LineTimetable from './lineTimetable';
import { groupDeparturesByDay } from '../timetable/timetableContainer';
import { isNumberVariant } from '../../util/domain';

const lineQuery = gql`
  query lineQuery($lineId: String!, $dateBegin: Date!, $dateEnd: Date!) {
    lines: getLinesWithIdAndUserDateRange(
      id: $lineId
      lineDateBegin: $dateBegin
      lineDateEnd: $dateEnd
    ) {
      nodes {
        lineId
        lineIdParsed
        nameFi
        nameSe
        dateBegin
        dateEnd
        trunkRoute
        routes: routesForDateRange(routeDateBegin: $dateBegin, routeDateEnd: $dateEnd) {
          nodes {
            routeId
            routeIdParsed
            direction
            dateBegin
            dateEnd
            mode
            nameFi
            nameSe
            lineId
            routeSegments {
              nodes {
                stop: stopByStopId {
                  nameFi
                  nameSe
                  stopId
                }
              }
            }
            timedStops: allTimedStops {
              nodes {
                stop: stopByStopId {
                  nameFi
                  nameSe
                  stopId
                }
                dateBegin
                dateEnd
              }
            }
            timedStopsDepartures: departuresForTimedStops(
              userDateBegin: $dateBegin
              userDateEnd: $dateEnd
            ) {
              nodes {
                stopId
                routeId
                direction
                dayType
                departureId
                hours
                minutes
                isNextDay
                dateBegin
                dateEnd
                timingStopType
                stopIndex
                note
              }
            }
          }
        }
        notes {
          nodes {
            noteType
            noteText
            dateEnd
          }
        }
      }
    }
  }
`;

const regularDayTypes = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];

const groupByValidityDateRange = departures => {
  const dateRanges = uniqBy(departures, 'dateBegin').map(entry => {
    return {
      dateBegin: entry.dateBegin,
      dateEnd: entry.dateEnd,
    };
  });
  const groupedDepartures = dateRanges.map(dateRange => {
    return {
      ...dateRange,
      departures: filter(departures, departure => {
        return (
          departure.dateBegin === dateRange.dateBegin &&
          departure.dateEnd === dateRange.dateEnd &&
          regularDayTypes.includes(departure.dayType[0])
        );
      }),
    };
  });
  return groupedDepartures;
};

const groupDepartureDateRangesForStops = (route, departuresByDateRanges) => {
  const timedStops = route.timedStops.nodes;

  const departuresByDateRangeAndStop = departuresByDateRanges.map(dateRange => {
    return {
      ...route,
      dateBegin: dateRange.dateBegin,
      dateEnd: dateRange.dateEnd,
      departuresPerStop: timedStops.map(timedStop => {
        return {
          stop: timedStop.stop,
          departures: filter(dateRange.departures, { stopId: timedStop.stop.stopId }),
        };
      }),
    };
  });
  return departuresByDateRangeAndStop;
};

const groupDeparturesByWeekday = departuresByStop => {
  return departuresByStop.map(stopWithDepartures => {
    return {
      stop: stopWithDepartures.stop,
      departures: groupDeparturesByDay(stopWithDepartures.departures),
    };
  });
};

const hasSameTimedStops = (variantRoute, regularRoute) => {
  const regularTimedStops = regularRoute.timedStops.nodes;
  const variantTimedStops = variantRoute.timedStops.nodes;

  if (regularTimedStops.length !== variantTimedStops.length) {
    return false;
  }

  let hasSameStops = true;
  for (let i = 0; i < regularTimedStops.length; i++) {
    const regularRouteStop = regularTimedStops[i];
    const variantRouteStop = variantTimedStops[i];

    if (regularRouteStop.stop.stopId !== variantRouteStop.stop.stopId) {
      hasSameStops = false;
    }
  }
  return hasSameStops;
};

// Merge variant routes from the timetable if they have the same timed stops.
const mergeExtraRoutes = routes => {
  // Filter 'varikkolinja' routes from the list
  const filteredRoutes = filter(routes, route => {
    if (route.mode === 'TRAM') {
      return !isNumberVariant(route.routeId);
    }
    return true;
  });

  const regularRoutes = filter(filteredRoutes, route => {
    return !route.routeId.includes(' ');
  });

  const variantRoutes = filter(filteredRoutes, route => {
    return route.routeId.includes(' ');
  });

  forEach(variantRoutes, variantRoute => {
    forEach(regularRoutes, regularRoute => {
      if (
        regularRoute.routeIdParsed === variantRoute.routeIdParsed &&
        regularRoute.mode === variantRoute.mode &&
        regularRoute.direction === variantRoute.direction
      ) {
        if (hasSameTimedStops(variantRoute, regularRoute)) {
          // Found a matching "regular" route where we can merge variant departures
          regularRoute.timedStopsDepartures.nodes.push(...variantRoute.timedStopsDepartures.nodes);
        }
      }
    });
  });
  return regularRoutes;
};

// Filters empty routes from the timetable
const filterRoutes = routesWithGroupedDepartures => {
  return filter(routesWithGroupedDepartures, route => {
    return !isEmpty(route.departuresByDateRanges);
  });
};

const filterNotes = (notes, dateBegin) => {
  const timetableDateBegin = new Date(dateBegin);
  const filteredNotes = notes.filter(note => {
    if (note.dateEnd === null) {
      return true;
    }
    const noteDateEnd = new Date(note.dateEnd);
    return noteDateEnd > timetableDateBegin;
  });
  const duplicatesRemoved = uniqWith(filteredNotes, (a, b) => a.noteText === b.noteText);
  return duplicatesRemoved;
};

const lineQueryMapper = mapProps(props => {
  const line = props.data.lines.nodes[0];
  const { showPrintButton, lang } = props;

  const mergedRoutes = mergeExtraRoutes(line.routes.nodes);

  const routesWithGroupedDepartures = mergedRoutes.map(route => {
    const byValidityDateRange = groupByValidityDateRange(route.timedStopsDepartures.nodes);
    const departuresByStopsAndDateRanges = groupDepartureDateRangesForStops(
      route,
      byValidityDateRange,
    );
    const dateRangesGroupedByStopAndDay = departuresByStopsAndDateRanges.map(
      departuresByStopAndDateRange => {
        return {
          dateBegin: departuresByStopAndDateRange.dateBegin,
          dateEnd: departuresByStopAndDateRange.dateEnd,
          departuresByStop: groupDeparturesByWeekday(
            departuresByStopAndDateRange.departuresPerStop,
          ),
        };
      },
    );
    return { ...route, departuresByDateRanges: dateRangesGroupedByStopAndDay };
  });

  const filteredNotes = filterNotes(line.notes.nodes, props.dateBegin);

  return {
    line: { ...line, notes: filteredNotes },
    routes: filterRoutes(routesWithGroupedDepartures),
    showPrintButton,
    lang,
  };
});

const hoc = compose(graphql(lineQuery), apolloWrapper(lineQueryMapper));

const LineTimetableContainer = hoc(LineTimetable);

LineTimetableContainer.defaultProps = {
  showPrintButton: false,
  lang: 'fi',
  printPageNumbers: true,
};

LineTimetableContainer.propTypes = {
  lineId: PropTypes.string.isRequired,
  dateBegin: PropTypes.string.isRequired,
  dateEnd: PropTypes.string.isRequired,
  showPrintButton: PropTypes.bool,
  lang: PropTypes.string,
  printPageNumbers: PropTypes.bool,
};

export default LineTimetableContainer;
