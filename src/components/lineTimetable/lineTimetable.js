import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './lineTimetable.css';
import LineTimetableHeader from './lineTimetableHeader';
import LineTableColumns from './lineTableColumns';
import AllStopsList from './allStopsList';
import { PrintButton } from '../util';
import {
  filter,
  uniqBy,
  flatten,
  forEach,
  groupBy,
  unionWith,
  omit,
  isEqual,
  some,
  uniq,
  sortBy,
} from 'lodash';
import { scheduleSegments } from '../../util/domain';
import { addMissingFridayNote, combineConsecutiveDays } from '../timetable/timetableContainer';
import { shortenTrainParsedLineId } from '../../util/routes';

const MAX_STOPS = 4; // Maximum amount of timed stops rendered on the timetable

const A5_PAGE_HEIGHT = 960;
const PAGE_NUMBER_HEIGHT = 21;

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
    const showDivider = departuresByStop.length === 1 ? false : !showTimedStops;
    return (
      <div>
        <LineTimetableHeader
          routeIdParsed={routeIdParsed}
          nameFi={nameFi}
          nameSe={nameSe}
          lang={lang}
        />
        <span className={styles.timetableDays}>{getScheduleWeekdaysText(key)}</span>
        <span className={styles.timetableDates}>
          {formatDate(new Date(dateBegin))}-{formatDate(new Date(dateEnd))}
        </span>
        <LineTableColumns
          showDivider={showDivider}
          departuresByStop={mergedWeekdaysDepartures}
          days={key}
        />
        <div className={styles.pageBreak} />
      </div>
    );
  });

  return <div>{combinedDepartureTables}</div>;
};

RouteDepartures.defaultProps = {
  routeIdParsed: '',
  nameFi: '',
  nameSe: '',
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
  lang: PropTypes.string,
  departuresByStop: PropTypes.object,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  showTimedStops: PropTypes.bool,
};

const checkForTrainRoutes = routes => {
  return routes.map(route => {
    if (route.mode === 'RAIL') {
      return { ...route, routeIdParsed: shortenTrainParsedLineId(route.routeIdParsed) };
    }
    return route;
  });
};

// Add note for friday departures because of merged timetables
const addFridayNote = notes => {
  const mutableArr = notes.splice(0);
  return mutableArr.splice(0, 0, { noteText: 'p) Vain perjantaisin' });
};

const hasFridayDepartures = routes => {
  let hasFriDepartures = false;
  forEach(routes, route => {
    const departures = [...route.timedStopsDepartures.nodes];
    const fridayDepartures = departures.filter(departure => departure.dayType.includes('Pe'));
    hasFriDepartures = hasFriDepartures ? true : fridayDepartures.length > 0;
  });
  return hasFriDepartures;
};

const usesFridayDepartureNote = routes => {
  let usesFridayDepartureNotation = true;
  forEach(routes, route => {
    usesFridayDepartureNotation = !usesFridayDepartureNotation ? false : route.mode !== 'TRAM';
  });
  return usesFridayDepartureNotation;
};
class LineTimetable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      renderPageNumbers: false,
    };
  }

  componentDidMount() {
    const { renderPageNumbers } = this.state;
    if (this.props.printPageNumbers && !renderPageNumbers) {
      this.setState({ renderPageNumbers: false });
    }
  }

  render() {
    const { routes } = this.props;
    let { notes } = this.props.line;
    if (hasFridayDepartures(routes) && usesFridayDepartureNote(routes)) {
      const addedFridayNotes = addFridayNote(this.props.line.notes);
      notes = uniq(addedFridayNotes);
    }

    const showTimedStops = hasTimedStopRoutes(routes);
    const checkedRoutes = checkForTrainRoutes(routes);

    const mappedNotes = notes.map(note => {
      return (
        <div key={note} className={styles.footnote}>
          {note.noteText}
        </div>
      );
    });

    const pageNumberPositions = [];

    if (this.state.renderPageNumbers && this.content) {
      const { scrollHeight } = this.content;
      const pages = Math.ceil(scrollHeight / A5_PAGE_HEIGHT);
      let index = 0;
      let inverseIndex = pages + 1;
      for (let i = 1; i < pages + 1; i++) {
        pageNumberPositions.push({
          top: i * A5_PAGE_HEIGHT + index * PAGE_NUMBER_HEIGHT,
          bottom: inverseIndex * A5_PAGE_HEIGHT - index * PAGE_NUMBER_HEIGHT,
        });
        index++;
        inverseIndex--;
      }
    }

    if (showTimedStops) {
      return (
        <div>
          <div
            ref={ref => {
              this.content = ref;
            }}>
            {checkedRoutes.map(routeWithDepartures => {
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

              const sortedRoutes = sortBy(routesByDateRanges, ['dateBegin']);

              const routeDeparturesForDateRanges = sortedRoutes.map(routeForDateRange => {
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
                    <div>
                      <div className={styles.printBtnContainer}>
                        {this.props.showPrintButton && <PrintButton lang={this.props.lang} />}
                      </div>
                      <RouteDepartures
                        routeIdParsed={routeIdParsed}
                        nameFi={nameFi}
                        nameSe={nameSe}
                        lang={this.props.lang}
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
            {checkedRoutes.length >= 1 && (
              <div className={styles.notesContainer}>{mappedNotes}</div>
            )}
            {checkedRoutes.length === 0 && (
              <div className={styles.notesContainer}>
                Linjaa ei löytynyt, tarkista tulosteen asetukset
              </div>
            )}
            {pageNumberPositions.length > 0 &&
              pageNumberPositions.map((position, index) => {
                const pageNumber = index + 1;
                return (
                  <span
                    className={styles.pageNumber}
                    style={{ top: `${position.top}px`, bottom: `${position.bottom}px` }}>
                    {pageNumber}
                  </span>
                );
              })}
          </div>
        </div>
      );
    }

    // The logic below is for timetables that do not have timed stops to display, only the starting stop for a route.
    // These stops are displayed with both directions side by side in the timetable.
    const groupedRoutes = groupBy(checkedRoutes, 'routeId');

    // Map the departures from both directions into unique date ranges, so that we can display both directions for a date range side by side
    const routeGroupsMappedDepartures = Object.values(groupedRoutes).map(routeGroup => {
      const { routeId, routeIdParsed, nameFi, nameSe, routeSegments } = routeGroup[0];

      const allDepartureDateRanges = routeGroup.map(route => {
        return route.departuresByDateRanges;
      });

      const uniqueDateRanges = flatten(uniqBy(allDepartureDateRanges, 'dateBegin'));
      const sortedUniqueDateRanges = sortBy(uniqueDateRanges, ['dateBegin']);

      const mappedDeparturesBothDirections = sortedUniqueDateRanges.map(dateRange => {
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
      <div
        ref={ref => {
          this.content = ref;
        }}>
        {pageNumberPositions.length > 0 &&
          pageNumberPositions.map((position, index) => {
            const pageNumber = index + 1;
            return (
              <span
                className={styles.pageNumber}
                style={{ top: `${position.top}px`, bottom: `${position.bottom}px` }}>
                {pageNumber}
              </span>
            );
          })}
        {routeGroupsMappedDepartures.map(routeWithDepartures => {
          return routeWithDepartures.departuresByDateRanges.map(departuresForDateRange => {
            const { nameFi, nameSe, routeIdParsed } = routeWithDepartures;
            const { dateBegin, dateEnd, departuresByStop } = departuresForDateRange;

            const hasDepartures = some(departuresByStop, stop =>
              some(stop.departures, departureDay => departureDay.length > 0),
            );

            if (
              hasDepartures &&
              departuresByStop[0].stop.stopId === departuresByStop[1].stop.stopId
            ) {
              departuresByStop.pop(1);
            }

            return (
              <div>
                {hasDepartures && (
                  <div>
                    <div className={styles.printBtnContainer}>
                      {this.props.showPrintButton && <PrintButton lang={this.props.lang} />}
                    </div>
                    <RouteDepartures
                      routeIdParsed={routeIdParsed}
                      nameFi={nameFi}
                      nameSe={nameSe}
                      lang={this.props.lang}
                      departuresByStop={departuresByStop}
                      dateBegin={dateBegin}
                      dateEnd={dateEnd}
                      showTimedStops={showTimedStops}
                    />
                    <div className={styles.pageBreak} />
                  </div>
                )}
                {hasDepartures && (
                  <AllStopsList
                    stops={routeWithDepartures.routeSegments.nodes}
                    routeIdParsed={routeIdParsed}
                  />
                )}
                {hasDepartures && <div className={styles.timetableDivider} />}
              </div>
            );
          });
        })}
        {checkedRoutes.length >= 1 && <div className={styles.notesContainer}>{mappedNotes}</div>}
        {checkedRoutes.length === 0 && (
          <div className={styles.notesContainer}>
            Linjaa ei löytynyt, tarkista tulosteen asetukset
          </div>
        )}
      </div>
    );
  }
}

LineTimetable.defaultProps = {
  routes: {},
  showPrintButton: false,
  lang: 'fi',
  printPageNumbers: true,
};

LineTimetable.propTypes = {
  line: PropTypes.object.isRequired,
  routes: PropTypes.object,
  showPrintButton: PropTypes.bool,
  lang: PropTypes.string,
  printPageNumbers: PropTypes.bool,
};

export default LineTimetable;
