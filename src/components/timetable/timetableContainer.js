import PropTypes from "prop-types";
import { gql, graphql } from "react-apollo";
import mapProps from "recompose/mapProps";
import compose from "recompose/compose";
import find from "lodash/find";
import flatMap from "lodash/flatMap";
import uniq from "lodash/uniq";
import pick from "lodash/pick";

import apolloWrapper from "util/apolloWrapper";
import { isDropOffOnly } from "util/domain";

import Timetable from "./timetable";

function filterDepartures(departures, routeSegments) {
    return departures.filter(departure => (
        !isDropOffOnly(find(routeSegments, {
            routeId: departure.routeId,
            direction: departure.direction,
        }))
    ));
}

function groupDepartures(departures) {
    return {
        weekdays: departures.filter(departure => (
            departure.dayType.some(day => ["Ma", "Ti", "Ke", "To", "Pe"].includes(day))
        )),
        saturdays: departures.filter(departure => departure.dayType.includes("La")),
        sundays: departures.filter(departure => departure.dayType.includes("Su")),
    };
}

function getNotes(isSummerTimetable) {
    return function getNotesInner(routeSegment) {
        if (!routeSegment.hasRegularDayDepartures) {
            return [];
        }
        return routeSegment.notes.nodes
            // Y = Yleisöaikataulu
            .filter(({ noteType }) => noteType.includes("Y"))
            // V = Ympäri vuoden
            // K = Vain kesäaikataulu
            // T = Vain talviaikatalu
            .filter(({ noteType }) => (
                noteType.includes("V") || noteType.includes(isSummerTimetable ? "K" : "T")
            ))
            .map(note => note.noteText);
    };
}

const timetableQuery = gql`
    query timetableQuery($stopId: String!, $date: Date!) {
        stop: stopByStopId(stopId: $stopId) {
            siblings {
                nodes {
                    routeSegments: routeSegmentsForDate(date: $date) {
                        nodes {
                            routeId
                            direction
                            hasRegularDayDepartures
                            pickupDropoffType
                            notes {
                                nodes {
                                    noteText
                                    noteType
                                }
                            }
                        }
                    }

                    departures: departuresGropuped (date: $date) {
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

const propsMapper = mapProps((props) => {
    const departures = flatMap(
        props.data.stop.siblings.nodes,
        stop => filterDepartures(
            stop.departures.nodes,
            stop.routeSegments.nodes
        )
    );

    const { weekdays, saturdays, sundays } = pick(groupDepartures(departures), props.segments);

    let notes = flatMap(
        props.data.stop.siblings.nodes,
        stop => flatMap(stop.routeSegments.nodes, getNotes(props.isSummerTimetable))
    );
    // if (props.data.stop.siblings.nodes.some(stop =>
    //   stop.departures.nodes.some(departure => departure.isAccessible === false))
    // ) {
    //     notes.push("e) ei matalalattiavaunu / ej låggolvsvagn");
    // }
    notes = uniq(notes).sort();

    const dateBegin = props.dateBegin || flatMap(
        props.data.stop.siblings.nodes,
        stop => stop.departures.nodes.map(departure => departure.dateBegin)
    ).sort((a, b) => b.localeCompare(a))[0];
    const dateEnd = props.dateEnd || flatMap(
        props.data.stop.siblings.nodes,
        stop => stop.departures.nodes.map(departure => departure.dateEnd)
    ).sort((a, b) => a.localeCompare(b))[0];

    return {
        weekdays,
        saturdays,
        sundays,
        notes,
        dateBegin,
        dateEnd,
        isSummerTimetable: props.isSummerTimetable,
        showValidityPeriod: props.showValidityPeriod,
        showNotes: props.showNotes,
    };
});

const hoc = compose(
    graphql(timetableQuery),
    apolloWrapper(propsMapper)
);

const TimetableContainer = hoc(Timetable);

TimetableContainer.defaultProps = {
    dateBegin: null,
    dateEnd: null,
    isSummerTimetable: false,
    showValidityPeriod: true,
    showNotes: true,
    segments: ["weekdays", "saturdays", "sundays"],
};

TimetableContainer.propTypes = {
    stopId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    dateBegin: PropTypes.string,
    dateEnd: PropTypes.string,
    isSummerTimetable: PropTypes.bool,
    showValidityPeriod: PropTypes.bool,
    showNotes: PropTypes.bool,
    segments: PropTypes.arrayOf(PropTypes.oneOf(["weekdays", "saturdays", "sundays"])),
};

export default TimetableContainer;
