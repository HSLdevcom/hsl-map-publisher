/* eslint-disable no-undef */
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import mapProps from 'recompose/mapProps';
import compose from 'recompose/compose';
import { filter } from 'lodash';

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
  query getTimedStopDepartures($routeIdentifier: String!, $routeDirection: String!, $date: Date!) {
    departures: getRouteDeparturesForTimedStops(
      routeIdentifier: $routeIdentifier
      routeDirection: $routeDirection
      date: $date
    ) {
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

const filterTimedStopsListFromLineQuery = props => {
  const stopList = props.data.line.routes.nodes[0].routeSegments.nodes;
  const filteredStopsList = filter(stopList, stop => {
    return stop.stopIndex <= 1 || stop.timingStopType > 0;
  });
  return filteredStopsList;
};

const lineQueryMapper = mapProps(props => {
  const { dateBegin, dateEnd } = props;
  const { line } = props.data;
  const timedStops = filterTimedStopsListFromLineQuery(props);

  return {
    routes: props.data.routes,
    line,
    dateBegin,
    dateEnd,
    timedStops,
    date: props.date,
    routeIdentifier: line.routes.nodes[0].routeId,
    routeDirection: line.routes.nodes[0].direction,
  };
});

const departuresMapper = mapProps(props => {
  const departures = props.data.departures.nodes;

  const departuresByStop = props.timedStops.map(timedStop => {
    const stopDepartures = departures.filter(
      departure => departure.stopId === timedStop.stop.stopId,
    );
    return {
      stop: timedStop.stop,
      departures: groupDeparturesByDay(stopDepartures),
    };
  });

  return {
    routes: props.routes,
    line: props.line,
    dateBegin: props.dateBegin,
    dateEnd: props.dateEnd,
    departures: departuresByStop,
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
};

LineTimetableContainer.propTypes = {
  lineId: PropTypes.string.isRequired,
  stopId: PropTypes.string.isRequired,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  date: PropTypes.string,
};

export default LineTimetableContainer;
