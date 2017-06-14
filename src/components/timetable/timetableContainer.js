import PropTypes from "prop-types";
import { gql, graphql } from "react-apollo";
import mapProps from "recompose/mapProps";
import compose from "recompose/compose";
import find from "lodash/find";
import flatMap from "lodash/flatMap";
import groupBy from "lodash/groupBy";
import uniq from "lodash/uniq";
import pick from "lodash/pick";

import apolloWrapper from "util/apolloWrapper";
import { isDropOffOnly, trimRouteId } from "util/domain";

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
    let departures = flatMap(
        props.data.stop.siblings.nodes,
        stop => filterDepartures(
            stop.departures.nodes,
            stop.routeSegments.nodes
        )
    );

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

    const duplicateRoutes = [];

    // Search for routes with two different destinations from the same stop and add notes for them
    Object.values(
        groupBy(
            flatMap(props.data.stop.siblings.nodes, stop => stop.routeSegments.nodes)
                .filter(route => route.hasRegularDayDepartures && !isDropOffOnly(route)),
            route => route.routeId
        ))
        .filter(routes => routes.length > 1)
        .forEach(directions =>
            directions.forEach((direction) => {
                notes.push(`${trimRouteId(direction.routeId)}${"*".repeat(direction.direction)} ${direction.route.nodes[0].destinationFi} / ${direction.route.nodes[0].destinationSe}`);
                duplicateRoutes.push(direction.routeId);
            })
        );

    departures = departures.map(departure => ({
        ...departure,
        note: duplicateRoutes.includes(departure.routeId)
            ? [departure.note, "*".repeat(departure.direction)].join("")
            : departure.note,
    }));


    const { weekdays, saturdays, sundays } = pick(groupDepartures(departures), props.segments);

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
