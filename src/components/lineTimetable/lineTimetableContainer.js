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
            timedStopsDepartures: timedStopsDepartures(
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
                timingStopType
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

const groupDeparturesForStops = route => {
  const timedStops = route.timedStops.nodes;

  return {
    ...route,
    departuresPerStop: timedStops.map(timedStop => {
      return {
        ...timedStop,
        departures: filter(route.timedStopsDepartures.nodes, { stopId: timedStop.stop.stopId }),
      };
    }),
  };
};

const lineQueryMapper = mapProps(props => {
  const line = props.data.lines.nodes[0];
  const { showPrintBtn, lang } = props;

  const routesWithGroupedDepartures = line.routes.nodes.map(route => {
    const groupedByStop = groupDeparturesForStops(route);
    const groupedByStopAndDay = groupedByStop.departuresPerStop.map(stop => {
      return { stop: stop.stop, departures: groupDeparturesByDay(stop.departures) };
    });
    return { ...route, departuresByStop: groupedByStopAndDay };
  });

  return {
    line,
    routes: routesWithGroupedDepartures,
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
