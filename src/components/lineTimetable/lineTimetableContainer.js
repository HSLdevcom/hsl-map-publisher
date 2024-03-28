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
  const routeForSelectedDirection = find(props.data.line.routes.nodes, route => {
    return route.direction === props.routeDirection;
  });
  const stopList = routeForSelectedDirection.routeSegments.nodes;
  const filteredStopsList = filter(stopList, stop => {
    return stop.stopIndex <= 1 || stop.timingStopType > 0;
  });
  return { timedStops: filteredStopsList, allStops: stopList };
};

const lineQueryMapper = mapProps(props => {
  const { dateBegin, dateEnd, routeDirection, showPrintBtn, lang } = props;
  const { line } = props.data;
  const { timedStops, allStops } = filterTimedStopsListFromLineQuery(props);

  return {
    line,
    dateBegin,
    dateEnd,
    timedStops,
    allStops,
    date: props.date,
    routeIdentifier: props.lineId,
    routeDirection,
    showPrintBtn,
    lang,
  };
});

const departuresMapper = mapProps(props => {
  console.log(props);
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
    line: props.line,
    dateBegin: props.dateBegin,
    dateEnd: props.dateEnd,
    departures: departuresByStop,
    timedStops: props.timedStops,
    allStops: props.allStops,
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
  routeDirection: '1',
  showPrintBtn: false,
  lang: 'fi',
};

LineTimetableContainer.propTypes = {
  lineId: PropTypes.string.isRequired,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  date: PropTypes.string,
  routeDirection: PropTypes.string,
  showPrintBtn: PropTypes.bool,
  lang: PropTypes.string,
};

export default LineTimetableContainer;
