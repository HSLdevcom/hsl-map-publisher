import React from 'react';
import PropTypes from 'prop-types';
import styles from './lineTimetable.css';
import LineTimetableHeader from './lineTimetableHeader';
import LineTableColumns from './lineTableColumns';
import AllStopsList from './allStopsList';
import { filter, isEmpty, uniqBy, flatten, forEach, groupBy, find } from 'lodash';
import { scheduleSegments } from '../../util/domain';
import { combineConsecutiveDays } from '../timetable/timetableContainer';

const MAX_STOPS = 6; // Maximum amount of timed stops rendered on the timetable

const getScheduleWeekdaysText = dayType => {
  switch (dayType) {
    case scheduleSegments.weekdays:
      return 'Maanantai-Perjantai / Måndag-Fredag';
    case scheduleSegments.weekdaysExclFriday:
      return 'Maanantai-Torstai / Måndag-Torsdag';
    case scheduleSegments.fridays:
      return 'Perjantai / Fredag';
    case scheduleSegments.saturdays:
      return 'Lauantai / Lördag';
    case scheduleSegments.sundays:
      return 'Sunnuntai / Söndag';
    case scheduleSegments.weekends:
      return 'Lauantai-Sunnuntai / Lördag-Söndag';
    default:
      return '';
  }
};

const formatDate = date => {
  const day = date.getDate();
  const monthIndex = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}.${monthIndex}.${year}`;
};

const hasTimedStopRoutes = routes => {
  return filter(routes, route => route.timedStops.nodes.length > 1).length > 0;
};

const RouteDepartures = props => {
  const {
    showPrintBtn,
    lang,
    departuresByStop,
    routeIdParsed,
    nameFi,
    nameSe,
    dateBegin,
    dateEnd,
    showTimedStops,
  } = props;

  const mappedWeekdayDepartures = departuresByStop.map(departuresForStop => {
    const {
      mondays,
      tuesdays,
      wednesdays,
      thursdays,
      fridays,
      saturdays,
      sundays,
    } = departuresForStop.departures;

    return {
      stop: departuresForStop.stop,
      combinedDays: combineConsecutiveDays({
        mondays,
        tuesdays,
        wednesdays,
        thursdays,
        fridays,
        saturdays,
        sundays,
      }),
    };
  });

  const combinedDepartureTables = Object.keys(mappedWeekdayDepartures[0].combinedDays).map(key => {
    return (
      <div>
        <LineTimetableHeader
          routeIdParsed={routeIdParsed}
          nameFi={nameFi}
          nameSe={nameSe}
          showPrintBtn={showPrintBtn}
          lang={lang}
        />
        <span className={styles.timetableDays}>{getScheduleWeekdaysText(key)}</span>
        <span className={styles.timetableDates}>
          {formatDate(new Date(dateBegin))}-{formatDate(new Date(dateEnd))}
        </span>
        <LineTableColumns
          showDivider={!showTimedStops}
          departuresByStop={mappedWeekdayDepartures}
          days={key}
        />
      </div>
    );
  });

  return <div>{combinedDepartureTables}</div>;
};

RouteDepartures.defaultProps = {
  routeIdParsed: '',
  nameFi: '',
  nameSe: '',
  showPrintBtn: '',
  lang: '',
  departuresByStop: {},
  dateBegin: '',
  dateEnd: '',
  showTimedStops: true,
};

RouteDepartures.propTypes = {
  routeIdParsed: PropTypes.string,
  nameFi: PropTypes.string,
  nameSe: PropTypes.string,
  showPrintBtn: PropTypes.string,
  lang: PropTypes.string,
  departuresByStop: PropTypes.object,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  showTimedStops: PropTypes.bool,
};

const dateRangeHasDepartures = routeDepartures => {
  const hasDepartures = find(
    Object.values(routeDepartures.departuresByStop[0].departures),
    weekday => {
      return !isEmpty(weekday);
    },
  );
  return hasDepartures;
};

function LineTimetable(props) {
  const { routes } = props;
  const showTimedStops = hasTimedStopRoutes(routes);

  if (showTimedStops) {
    return (
      <div>
        {routes.map(routeWithDepartures => {
          const routesByDateRanges = routeWithDepartures.departuresByDateRanges.map(
            departuresForDateRange => {
              const { nameFi, nameSe, routeIdParsed } = routeWithDepartures;
              return {
                nameFi,
                nameSe,
                routeIdParsed,
                departuresByStop: departuresForDateRange.departuresByStop.slice(0, MAX_STOPS),
                dateBegin: departuresForDateRange.dateBegin,
                dateEnd: departuresForDateRange.dateEnd,
              };
            },
          );

          const routeDeparturesForDateRanges = routesByDateRanges.map(routeForDateRange => {
            const {
              nameFi,
              nameSe,
              routeIdParsed,
              departuresByStop,
              dateBegin,
              dateEnd,
            } = routeForDateRange;

            return (
              routeForDateRange.departuresByStop.length > 0 && (
                <div className={styles.pageBreak}>
                  <RouteDepartures
                    routeIdParsed={routeIdParsed}
                    nameFi={nameFi}
                    nameSe={nameSe}
                    showPrintBtn={props.showPrintBtn}
                    lang={props.lang}
                    departuresByStop={departuresByStop}
                    dateBegin={dateBegin}
                    dateEnd={dateEnd}
                    showTimedStops={showTimedStops}
                  />
                  <AllStopsList
                    stops={routeWithDepartures.routeSegments.nodes}
                    routeIdParsed={routeIdParsed}
                  />
                  <div className={styles.timetableDivider} />
                </div>
              )
            );
          });

          return routeDeparturesForDateRanges;
        })}
      </div>
    );
  }

  // The logic below is for timetables that do not have timed stops to display, only the starting stop for a route.
  // These stops are displayed with both directions side by side in the timetable.
  const groupedRoutes = groupBy(routes, 'routeId');

  // Map the departures from both directions into unique date ranges, so that we can display both directions for a date range side by side
  const routeGroupsMappedDepartures = Object.values(groupedRoutes).map(routeGroup => {
    const { routeId, routeIdParsed, nameFi, nameSe, routeSegments } = routeGroup[0];

    const allDepartureDateRanges = routeGroup.map(route => {
      return route.departuresByDateRanges;
    });

    const uniqueDateRanges = flatten(uniqBy(allDepartureDateRanges, 'dateBegin'));

    const mappedDeparturesBothDirections = uniqueDateRanges.map(dateRange => {
      const { dateBegin, dateEnd } = dateRange;
      const bothDirectionDepartures = [];

      forEach(allDepartureDateRanges, departureDateRange => {
        const departures = flatten(departureDateRange);
        if (departures[0].dateBegin === dateBegin && departures[0].dateEnd === dateEnd) {
          bothDirectionDepartures.push(departures[0].departuresByStop);
        }
      });
      return {
        dateBegin,
        dateEnd,
        departuresByStop: flatten(bothDirectionDepartures),
      };
    });

    return {
      routeId,
      routeIdParsed,
      nameFi,
      nameSe,
      routeSegments,
      departuresByDateRanges: mappedDeparturesBothDirections,
    };
  });

  return (
    <div>
      {routeGroupsMappedDepartures.map(routeWithDepartures => {
        return routeWithDepartures.departuresByDateRanges.map(departuresFordateRange => {
          const { nameFi, nameSe, routeIdParsed } = routeWithDepartures;
          const { dateBegin, dateEnd, departuresByStop } = departuresFordateRange;
          return (
            <div>
              <RouteDepartures
                routeIdParsed={routeIdParsed}
                nameFi={nameFi}
                nameSe={nameSe}
                showPrintBtn={props.showPrintBtn}
                lang={props.lang}
                departuresByStop={departuresByStop}
                dateBegin={dateBegin}
                dateEnd={dateEnd}
                showTimedStops={showTimedStops}
              />
              <AllStopsList
                stops={routeWithDepartures.routeSegments.nodes}
                routeIdParsed={routeIdParsed}
              />
            </div>
          );
        });
      })}
    </div>
  );
}

LineTimetable.defaultProps = {
  routes: {},
  showPrintBtn: false,
  lang: 'fi',
};

LineTimetable.propTypes = {
  line: PropTypes.object.isRequired,
  routes: PropTypes.object,
  showPrintBtn: PropTypes.bool,
  lang: PropTypes.string,
};

export default LineTimetable;
