/* eslint-disable no-undef */
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import mapProps from 'recompose/mapProps';
import compose from 'recompose/compose';
import { filter, isEmpty, uniqBy } from 'lodash';

import apolloWrapper from 'util/apolloWrapper';

import LineTimetable from './lineTimetable';
import { groupDeparturesByDay } from '../timetable/timetableContainer';

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

// Filters 'varikkolinja' routes from the timetable
const removeExtraRoutes = routes => {
  return filter(routes, route => {
    return !route.routeId.includes(' ');
  });
};

// Filters empty routes from the timetable
const filterRoutes = routesWithGroupedDepartures => {
  return filter(routesWithGroupedDepartures, route => {
    return !isEmpty(route.departuresByDateRanges);
  });
};

const getSpecialDepartures = departures => {
  return uniqBy(
    filter(departures, departure => {
      return !regularDayTypes.includes(departure.dayType[0]);
    }),
    'dateBegin',
  );
};

const lineQueryMapper = mapProps(props => {
  const line = props.data.lines.nodes[0];
  const { showPrintBtn, lang } = props;

  const filteredRoutes = removeExtraRoutes(line.routes.nodes);

  const routesWithGroupedDepartures = filteredRoutes.map(route => {
    const byValidityDateRange = groupByValidityDateRange(route.timedStopsDepartures.nodes);
    const specialDepartures = getSpecialDepartures(route.timedStopsDepartures.nodes);
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

  return {
    line,
    routes: filterRoutes(routesWithGroupedDepartures),
    showPrintBtn,
    lang,
  };
});

const hoc = compose(graphql(lineQuery), apolloWrapper(lineQueryMapper));

const LineTimetableContainer = hoc(LineTimetable);

LineTimetableContainer.defaultProps = {
  date: null,
  showPrintBtn: false,
  lang: 'fi',
};

LineTimetableContainer.propTypes = {
  lineId: PropTypes.string.isRequired,
  dateBegin: PropTypes.string.isRequired,
  dateEnd: PropTypes.string.isRequired,
  date: PropTypes.string,
  showPrintBtn: PropTypes.bool,
  lang: PropTypes.string,
};

export default LineTimetableContainer;
