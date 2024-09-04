import React from 'react';
import PropTypes from 'prop-types';
import styles from './lineTimetable.css';
import LineTimetableHeader from './lineTimetableHeader';
import LineTableColumns from './lineTableColumns';
import AllStopsList from './allStopsList';
import {
  filter,
  isEmpty,
  uniqBy,
  flatten,
  forEach,
  groupBy,
  find,
  unionWith,
  omit,
  isEqual,
  some,
} from 'lodash';
import { scheduleSegments } from '../../util/domain';
import { addMissingFridayNote, combineConsecutiveDays } from '../timetable/timetableContainer';

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

  // This fixes some errors in combined departures, such as ['saturdays-sundays'] for first 3 stops, and ['saturdays', 'sundays']
  const fixPartialWeekendDepartures = departureRange => {
    const firstStopDayKeys = Object.keys(departureRange[0].combinedDays);

    const hasPartialDepartures = some(departureRange, stop => {
      return !isEqual(Object.keys(stop.combinedDays), firstStopDayKeys);
    });

    if (hasPartialDepartures) {
      // 'saturdays-sundays' combined departures
      if (isEqual(firstStopDayKeys, [scheduleSegments.weekends])) {
        const remappedStopDepartures = departureRange.map(stop => {
          const stopKeys = Object.keys(stop.combinedDays);
          // Has differing departure keys compared to first stop
          if (!isEqual(stopKeys, firstStopDayKeys)) {
            const stopDepartures = stop.combinedDays.saturdays
              ? stop.combinedDays.saturdays
              : stop.combinedDays.sundays;
            return {
              ...stop,
              combinedDays: {
                [scheduleSegments.weekends]: { ...stopDepartures },
              },
            };
          }
          return stop;
        });
        return Object.values(
          omit(remappedStopDepartures, ['combinedDays.saturdays', 'combinedDays.sundays']), // Remove redundant departure arrays
        );
      }
      // 'saturdays' and 'sundays' departures separately
      if (isEqual(firstStopDayKeys, [scheduleSegments.saturdays, scheduleSegments.sundays])) {
        const remappedStopDepartures = departureRange.map(stop => {
          const stopKeys = Object.keys(stop.combinedDays);
          // Has differing departure keys compared to first stop
          if (!isEqual(stopKeys, firstStopDayKeys)) {
            return {
              ...stop,
              combinedDays: {
                [scheduleSegments.saturdays]: filter(stop.combinedDays.weekends, departure => {
                  return departure.dayType[0] === 'La';
                }),
                [scheduleSegments.sundays]: filter(stop.combinedDays.weekends, departure => {
                  return departure.dayType[0] === 'Su';
                }),
              },
            };
          }
          return stop;
        });
        return Object.values(omit(remappedStopDepartures, ['combinedDays.saturdays-sundays'])); // Remove redundant departure array
      }
    }

    return departureRange;
  };

  const mappedDepartures = departuresByStop.map(departuresForStop => {
    const {
      mondays,
      tuesdays,
      wednesdays,
      thursdays,
      fridays,
      saturdays,
      sundays,
    } = departuresForStop.departures;

    const stopWithCombinedDepartures = {
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
    return stopWithCombinedDepartures;
  });

  const sanityCheckedDepartures = fixPartialWeekendDepartures(mappedDepartures);
  const mergedWeekdaysDepartures = sanityCheckedDepartures.map(mappedDeparturesForStop => {
    if (
      mappedDeparturesForStop.combinedDays[scheduleSegments.fridays] &&
      mappedDeparturesForStop.combinedDays[scheduleSegments.weekdaysExclFriday]
    ) {
      // Merge friday departures onto Monday-Thursday departures and include a note so it can be displayed
      const combinedWeekdayDepartures = unionWith(
        mappedDeparturesForStop.combinedDays[scheduleSegments.weekdaysExclFriday],
        mappedDeparturesForStop.combinedDays[scheduleSegments.fridays],
        (weekday, friday) => {
          return weekday.hours === friday.hours && weekday.minutes === friday.minutes;
        },
      );
      const combinedWithNotes = combinedWeekdayDepartures.map(departure => {
        return { ...departure, note: addMissingFridayNote(departure) };
      });

      const mergedDepartures = {
        ...mappedDeparturesForStop,
        combinedDays: {
          [scheduleSegments.weekdays]: combinedWithNotes,
          ...mappedDeparturesForStop.combinedDays,
        },
      };
      return omit(mergedDepartures, ['combinedDays.mondays-thursdays', 'combinedDays.fridays']); // Remove redundant departure days, since we just combined them.
    }

    return { ...mappedDeparturesForStop };
  });

  const combinedDepartureTables = Object.keys(mergedWeekdaysDepartures[0].combinedDays).map(key => {
    return (
      <div className={styles.timetableContainer}>
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
          departuresByStop={mergedWeekdaysDepartures}
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
