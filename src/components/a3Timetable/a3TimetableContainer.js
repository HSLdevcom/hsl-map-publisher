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

import apolloWrapper from 'util/apolloWrapper';
import { isDropOffOnly, trimRouteId, filterRoute } from 'util/domain';

import A3Timetable from './a3Timetable';

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

function addMissingFridayNote(departure) {
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

  departures.forEach(departure => {
    if (departure.note && !specialSymbols.includes(departure.note)) {
      specialSymbols.push(departure.note);
    }
  });

  if (departures.some(departure => departure.routeId.includes('H'))) {
    specialSymbols.push('H');
  }

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

  const { weekdays, saturdays, sundays } = pick(groupDepartures(departures), props.segments);
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
  return {
    weekdays,
    saturdays,
    sundays,
    notes,
    dateBegin,
    dateEnd,
    date: props.date,
    isSummerTimetable: props.isSummerTimetable,
    showValidityPeriod: props.showValidityPeriod,
    showNotes: props.showNotes,
    showComponentName: !props.printTimetablesAsA4 && props.showComponentName,
    showStopInformation: props.printTimetablesAsA4,
    stopNameFi: props.data.stop.nameFi,
    stopNameSe: props.data.stop.nameSe,
    stopShortId: props.data.stop.shortId,
    stopId: props.data.stop.stopId,
    stopZone: props.data.stop.stopZone,
    greyscale: props.printTimetablesAsGreyscale,
    standalone: props.standalone,
    updateHook: props.updateHook,
    groupedRows: props.groupedRows,
    diagram: props.diagram,
    specialSymbols,
  };
});

const hoc = compose(graphql(timetableQuery), apolloWrapper(propsMapper));

const TimetableContainer = hoc(A3Timetable);

TimetableContainer.defaultProps = {
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
};

TimetableContainer.propTypes = {
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
  printTimetablesAsGreyscale: PropTypes.bool,
  specialSymbols: PropTypes.array,
};

export default TimetableContainer;
