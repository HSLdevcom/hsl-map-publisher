/* eslint-disable no-undef */
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import mapProps from 'recompose/mapProps';
import compose from 'recompose/compose';
import { filter, find } from 'lodash';

import apolloWrapper from 'util/apolloWrapper';

import LineTimetable from './lineTimetable';
import { groupDeparturesByDay } from '../timetable/timetableContainer';

const lineQuery = gql`
  query lineQuery($lineId: String!, $dateBegin: Date!, $dateEnd: Date!) {
    line: lineByLineIdAndDateBeginAndDateEnd(
      lineId: $lineId
      dateBegin: $dateBegin
      dateEnd: $dateEnd
    ) {
      lineId
      lineIdParsed
      nameFi
      nameSe
      dateBegin
      dateEnd
      trunkRoute
      routes {
        nodes {
          routeId
          direction
          dateBegin
          dateEnd
          mode
          nameFi
          nameSe
          line {
            nodes {
              trunkRoute
              lineIdParsed
            }
          }
          routeSegments {
            nodes {
              stopIndex
              timingStopType
              duration
              line {
                nodes {
                  trunkRoute
                }
              }
              stop: stopByStopId {
                stopId
                lat
                lon
                shortId
                nameFi
                nameSe
                platform
              }
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
`;

const departureQuery = gql`
  query getTimedStopDepartures($routeIdentifier: String!, $date: Date!) {
    departures: getRouteDeparturesForTimedStops(routeIdentifier: $routeIdentifier, date: $date) {
      nodes {
        stopId
        routeId
        direction
        departureId
        dayType
        hours
        minutes
        isNextDay
        timingStopType
      }
    }
  }
`;

const filterTimedStopsForRoutes = props => {
  const routes = props.data.line.routes.nodes;

  const routesWithFilteredStops = routes.map(route => {
    return {
      ...route,
      timedStops: filter(route.routeSegments.nodes, segment => {
        return segment.stopIndex <= 1 || segment.timingStopType > 0;
      }),
    };
  });

  return routesWithFilteredStops;
};

const lineQueryMapper = mapProps(props => {
  const { dateBegin, dateEnd, showPrintBtn, lang } = props;
  const { line } = props.data;
  const routesWithFilteredStops = filterTimedStopsForRoutes(props);

  return {
    line,
    dateBegin,
    dateEnd,
    routesWithFilteredStops,
    date: props.date,
    routeIdentifier: props.lineId,
    showPrintBtn,
    lang,
  };
});

const departuresMapper = mapProps(props => {
  const departures = props.data.departures.nodes;

  const routeDeparturesByStop = props.routesWithFilteredStops.map(route => {
    const timedStopDepartures = route.timedStops.map(timedStop => {
      // Iterate each timed stop for a given route and get all departures belonging to that stop and route direction
      const stopDepartures = departures.filter(
        departure =>
          departure.stopId === timedStop.stop.stopId && departure.direction === route.direction,
      );
      return {
        stop: timedStop.stop,
        departures: groupDeparturesByDay(stopDepartures),
        route,
      };
    });
    return { ...route, departuresByStop: timedStopDepartures };
  });

  return {
    line: props.line,
    dateBegin: props.dateBegin,
    dateEnd: props.dateEnd,
    departures: routeDeparturesByStop,
    showPrintBtn: props.showPrintBtn,
    lang: props.lang,
  };
});

const hoc = compose(
  graphql(lineQuery),
  apolloWrapper(lineQueryMapper),
  graphql(departureQuery),
  apolloWrapper(departuresMapper),
);

const LineTimetableContainer = hoc(LineTimetable);

LineTimetableContainer.defaultProps = {
  dateBegin: null,
  dateEnd: null,
  date: null,
  showPrintBtn: false,
  lang: 'fi',
};

LineTimetableContainer.propTypes = {
  lineId: PropTypes.string.isRequired,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  date: PropTypes.string,
  showPrintBtn: PropTypes.bool,
  lang: PropTypes.string,
};

export default LineTimetableContainer;
