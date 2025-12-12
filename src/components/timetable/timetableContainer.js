import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import mapProps from 'recompose/mapProps';
import compose from 'recompose/compose';
import find from 'lodash/find';
import flatMap from 'lodash/flatMap';
import groupBy from 'lodash/groupBy';
import uniq from 'lodash/uniq';
import pick from 'lodash/pick';
import fromPairs from 'lodash/fromPairs';
import get from 'lodash/get';

import apolloWrapper from 'util/apolloWrapper';
import { isDropOffOnly, trimRouteId, filterRoute } from 'util/domain';

import Timetable from './timetable';

function filterDepartures(departures, routeSegments, routeFilter) {
  return departures
    .filter(
      departure =>
        !isDropOffOnly(
          find(routeSegments, {
            routeId: departure.routeId,
            direction: departure.direction,
          }),
        ),
    )
    .filter(departure => filterRoute({ routeId: departure.routeId, filter: routeFilter }));
}

function groupDepartures(departures) {
  return {
    weekdays: departures.filter(departure =>
      departure.dayType.some(day => ['Ma', 'Ti', 'Ke', 'To', 'Pe'].includes(day)),
    ),
    saturdays: departures.filter(departure => departure.dayType.includes('La')),
    sundays: departures.filter(departure => departure.dayType.includes('Su')),
  };
}

export function groupDeparturesByDay(departures) {
  return {
    mondays: departures.filter(departure => departure.dayType.includes('Ma')),
    tuesdays: departures.filter(departure => departure.dayType.includes('Ti')),
    wednesdays: departures.filter(departure => departure.dayType.includes('Ke')),
    thursdays: departures.filter(departure => departure.dayType.includes('To')),
    fridays: departures.filter(departure => departure.dayType.includes('Pe')),
    saturdays: departures.filter(departure => departure.dayType.includes('La')),
    sundays: departures.filter(departure => departure.dayType.includes('Su')),
  };
}

// Compare two individual departure objects for equality
function areDeparturesEqual(a, b) {
  return (
    a.hours === b.hours &&
    a.minutes === b.minutes &&
    a.routeId === b.routeId &&
    a.direction === b.direction
  );
}

// Compare two arrays of departure objects for equality
function areDepartureArraysEqual(arr1, arr2) {
  // Filter out departures with note set to 'pe' from both arrays
  // We want 'pe' departures to still be shown as they are used to
  const filteredArr1 = arr1.filter(departure => departure.note !== 'pe');
  const filteredArr2 = arr2.filter(departure => departure.note !== 'pe');

  // Different lengths mean they can't be equal
  if (filteredArr1.length !== filteredArr2.length) {
    return false;
  }

  // Compare each pair of departures in the two arrays
  for (let i = 0; i < filteredArr1.length; i++) {
    if (!areDeparturesEqual(filteredArr1[i], filteredArr2[i])) {
      return false;
    }
  }

  // If we get here, all pairs were equal
  return true;
}

export function combineConsecutiveDays(daysObject) {
  let currentStartDay = null;
  let currentDepartures = null;

  const combinedDays = {};

  const flushCurrentSequence = (startDay, endDay) => {
    const combinedKey = startDay === endDay ? startDay : `${startDay}-${endDay}`;
    // If endDay is 'fridays', use the departures from that day so we have the 'pe' departures in the timetables
    combinedDays[combinedKey] = endDay === 'fridays' ? daysObject[endDay] : daysObject[startDay];
  };

  const weekdays = ['mondays', 'tuesdays', 'wednesdays', 'thursdays', 'fridays'];
  const weekend = ['saturdays', 'sundays'];

  // Function to process a set of consecutive days (either weekdays or weekend)
  const processConsecutiveDays = dayList => {
    currentStartDay = null;
    currentDepartures = null;
    for (let i = 0; i < dayList.length; i++) {
      const day = dayList[i];
      const departures = daysObject[day];

      // Starting a new sequence
      if (currentDepartures === null) {
        currentStartDay = day;
        currentDepartures = departures;
      }
      // Current day's departures are equal to current sequence's departures
      else if (areDepartureArraysEqual(currentDepartures, departures)) {
        if (i === dayList.length - 1) {
          flushCurrentSequence(currentStartDay, day);
        }
      }
      // Current day's departures are different
      else {
        flushCurrentSequence(currentStartDay, dayList[i - 1]);
        currentStartDay = day;
        currentDepartures = departures;
        if (i === dayList.length - 1) {
          flushCurrentSequence(currentStartDay, day);
        }
      }
    }
  };

  // Process weekdays and weekend separately
  processConsecutiveDays(weekdays);
  processConsecutiveDays(weekend);

  // Remove empty arrays
  const filteredDepartures = Object.fromEntries(
    Object.entries(combinedDays).filter(([key, value]) => value.length !== 0),
  );

  const removePeNotes = departures =>
    departures.map(departure => {
      if (departure.note === 'pe') {
        const { note, ...rest } = departure;
        return rest;
      }
      if (departure.note && departure.note.includes('pe')) {
        return {
          ...departure,
          note: departure.note.replace('pe', '').trim(),
        };
      }
      return departure;
    });

  // Is friday's departures are own their own. Dont show "pe" notes
  Object.keys(filteredDepartures).forEach(key => {
    if (key === 'fridays') {
      filteredDepartures[key] = removePeNotes(filteredDepartures[key]);
    }
  });
  return filteredDepartures;
}

function getNotes(isSummerTimetable) {
  // because apparently there may be many
  let didForceShowPNote = false;

  return function getNotesInner(routeSegment) {
    if (!routeSegment.hasRegularDayDepartures) {
      return [];
    }

    return (
      routeSegment.notes.nodes
        // Y = Yleisöaikataulu
        // V = Ympäri vuoden
        // K = Vain kesäaikataulu
        // T = Vain talviaikatalu
        .filter(({ noteType, noteText }) => {
          // Find the pe or p notes and force them to show.
          if (!didForceShowPNote && /^pe?\s/.test(noteText)) {
            didForceShowPNote = true;
            return true;
          }

          if (/^e\s/.test(noteText)) {
            return true;
          }

          return (
            noteType.includes('Y') &&
            (noteType.includes('V') || noteType.includes(isSummerTimetable ? 'K' : 'T'))
          );
        })
        .map(note => {
          const noteText = note.noteText || '';
          return noteText.replace(/^(p|pe)(\s=)?\s/, 'pe = ').replace('s', `'s`);
        })
    );
  };
}

const timetableQuery = gql`
  query timetableQuery($stopId: String!, $date: Date!) {
    stop: stopByStopId(stopId: $stopId) {
      nameFi
      nameSe
      shortId
      stopId
      stopZone
      platform
      addressFi
      addressSe
      siblings {
        nodes {
          routeSegments: routeSegmentsForDate(date: $date) {
            nodes {
              routeId
              direction
              hasRegularDayDepartures(date: $date)
              pickupDropoffType
              route {
                nodes {
                  destinationFi
                  destinationSe
                  mode
                }
              }
              notes(date: $date) {
                nodes {
                  noteText
                  noteType
                }
              }
            }
          }

          departures: departuresGropuped(date: $date) {
            nodes {
              hours
              minutes
              note
              routeId
              direction
              dayType
              isNextDay
              isAccessible
              dateBegin
              dateEnd
            }
          }
        }
      }
    }
  }
`;

function getDuplicateRouteNote(duplicateRoutes, departure) {
  return duplicateRoutes.includes(departure.routeId) ? '*'.repeat(departure.direction) : null;
}

export function addMissingFridayNote(departure) {
  return departure.dayType.length === 1 &&
    departure.dayType.includes('Pe') &&
    (!departure.note || !departure.note.includes('p'))
    ? 'p'
    : null;
}

function addMissingNonAccessibleNote(departure) {
  return departure.isAccessible === false && (!departure.note || !departure.note.includes('e'))
    ? 'e'
    : null;
}

// Bandaid for making the notes uniform and logical
function modifyNote(departureNote) {
  if (!departureNote) {
    return null;
  }

  switch (departureNote) {
    case 'p':
      return 'pe';
    case 'pe':
      return 'pe\u202Fe';
    default:
      return departureNote;
  }
}

const propsMapper = mapProps(props => {
  let departures = flatMap(props.data.stop.siblings.nodes, stop =>
    filterDepartures(stop.departures.nodes, stop.routeSegments.nodes, props.routeFilter),
  );

  const routeIdToModeMap = fromPairs(
    flatMap(props.data.stop.siblings.nodes, sibling =>
      sibling.routeSegments.nodes.map(seg => [
        trimRouteId(seg.routeId),
        get(seg, 'route.nodes[0].mode'),
      ]),
    ),
  );

  let notes = flatMap(props.data.stop.siblings.nodes, stop =>
    flatMap(stop.routeSegments.nodes, getNotes(props.isSummerTimetable)),
  );
  // if (props.data.stop.siblings.nodes.some(stop =>
  //   stop.departures.nodes.some(departure => departure.isAccessible === false))
  // ) {
  //     notes.push("e) ei matalalattiavaunu / ej låggolvsvagn");
  // }
  notes = uniq(notes).sort();

  const duplicateRoutes = [];
  const specialSymbols = [];
  // Search for routes with two different destinations from the same stop and add notes for them
  Object.values(
    groupBy(
      flatMap(props.data.stop.siblings.nodes, stop => stop.routeSegments.nodes).filter(
        route => route.hasRegularDayDepartures && !isDropOffOnly(route),
      ),
      route => route.routeId,
    ),
  )
    .filter(routes => routes.length > 1)
    .forEach(directions =>
      directions.forEach(direction => {
        const noteSymbol = `${trimRouteId(direction.routeId)}${'*'.repeat(direction.direction)}`;
        if (!specialSymbols.includes(noteSymbol)) {
          specialSymbols.push(noteSymbol);
        }
        notes.push(
          `${trimRouteId(direction.routeId)}${'*'.repeat(direction.direction)} ${
            direction.route.nodes[0].destinationFi
          } / ${direction.route.nodes[0].destinationSe}`,
        );
        duplicateRoutes.push(direction.routeId);
      }),
    );
  departures = departures.map(departure => ({
    ...departure,
    note: modifyNote(
      [
        departure.note,
        addMissingNonAccessibleNote(departure),
        addMissingFridayNote(departure),
        getDuplicateRouteNote(duplicateRoutes, departure),
      ].join(''),
    ),
  }));

  const { weekdays } = pick(groupDepartures(departures), props.segments);
  const dateBegin =
    props.dateBegin ||
    flatMap(props.data.stop.siblings.nodes, stop =>
      stop.departures.nodes.map(departure => departure.dateBegin),
    ).sort((a, b) => b.localeCompare(a))[0];
  const dateEnd =
    props.dateEnd ||
    flatMap(props.data.stop.siblings.nodes, stop =>
      stop.departures.nodes.map(departure => departure.dateEnd),
    ).sort((a, b) => a.localeCompare(b))[0];

  const {
    mondays,
    tuesdays,
    wednesdays,
    thursdays,
    fridays,
    saturdays,
    sundays,
  } = groupDeparturesByDay(departures);
  const segmentMap = {
    weekdays: 'mondays-fridays',
    saturdays: 'saturdays',
    sundays: 'sundays',
  };

  const combinedDays = (() => {
    if (props.segments.length > 0) {
      const result = {};
      const groupedDepartures = groupDepartures(departures);
      const pickedDepartures = pick(groupedDepartures, props.segments);

      for (const segment of props.segments) {
        if (
          segmentMap[segment] &&
          pickedDepartures[segment] &&
          pickedDepartures[segment].length > 0
        ) {
          result[segmentMap[segment]] = pickedDepartures[segment];
        }
      }

      return result;
    }
    return combineConsecutiveDays({
      mondays,
      tuesdays,
      wednesdays,
      thursdays,
      fridays,
      saturdays,
      sundays,
    });
  })();

  const combinedDepartures = [].concat(...Object.values(combinedDays));
  combinedDepartures.forEach(departure => {
    if (departure.note && !specialSymbols.includes(departure.note)) {
      specialSymbols.push(departure.note);
    }
  });

  if (combinedDepartures.some(departure => departure.routeId.includes('H'))) {
    specialSymbols.push('H');
  }

  return {
    saturdays,
    sundays,
    combinedDays,
    notes,
    dateBegin,
    dateEnd,
    intervalTimetable: props.intervalTimetable,
    date: props.date,
    isSummerTimetable: props.isSummerTimetable,
    showValidityPeriod: props.showValidityPeriod,
    showNotes: props.showNotes,
    showComponentName: !props.printTimetablesAsA4 && props.showComponentName,
    showStopInformation: props.printTimetablesAsA4 || props.showStopInformation,
    stopNameFi: props.data.stop.nameFi,
    stopNameSe: props.data.stop.nameSe,
    stopShortId: props.data.stop.shortId,
    stopId: props.data.stop.stopId,
    addressFi: props.data.stop.addressFi,
    addressSe: props.data.stop.addressSe,
    stopZone: props.data.stop.stopZone,
    platform: props.data.stop.platform,
    printableAsA4: props.printTimetablesAsA4,
    greyscale: props.printTimetablesAsGreyscale,
    standalone: props.standalone,
    specialSymbols,
    platformInfo: props.platformInfo,
    hasDepartures: departures.length > 0,
    showAddressInfo: props.showAddressInfo,
    showPrintButton: props.showPrintButton,
    lang: props.lang,
    showCoverPage: props.showCoverPage,
    useCompactLayout: props.useCompactLayout,
    routeIdToModeMap,
  };
});

const hoc = compose(graphql(timetableQuery), apolloWrapper(propsMapper));

const TimetableContainer = hoc(Timetable);

TimetableContainer.defaultProps = {
  intervalTimetable: false,
  dateBegin: null,
  dateEnd: null,
  isSummerTimetable: false,
  showValidityPeriod: true,
  showNotes: true,
  segments: ['weekdays', 'saturdays', 'sundays'],
  showComponentName: true,
  printTimetablesAsA4: false,
  printTimetablesAsGreyscale: false,
  specialSymbols: [],
  showStopInformation: false,
  showAddressInfo: true,
  showPrintButton: false,
  lang: 'fi',
  showCoverPage: false,
  useCompactLayout: false,
  routeIdToModeMap: {},
};

TimetableContainer.propTypes = {
  intervalTimetable: PropTypes.bool,
  stopId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  isSummerTimetable: PropTypes.bool,
  showValidityPeriod: PropTypes.bool,
  showNotes: PropTypes.bool,
  segments: PropTypes.arrayOf(PropTypes.oneOf(['weekdays', 'saturdays', 'sundays'])),
  showComponentName: PropTypes.bool,
  standalone: PropTypes.bool,
  printTimetablesAsA4: PropTypes.bool,
  intervalTimeTable: PropTypes.bool,
  printTimetablesAsGreyscale: PropTypes.bool,
  specialSymbols: PropTypes.array,
  showStopInformation: PropTypes.bool,
  showAddressInfo: PropTypes.bool,
  showPrintButton: PropTypes.bool,
  combinedDays: PropTypes.object,
  lang: PropTypes.string,
  showCoverPage: PropTypes.bool,
  useCompactLayout: PropTypes.bool,
  routeIdToModeMap: PropTypes.object,
};

export default TimetableContainer;
