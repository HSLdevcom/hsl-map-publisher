import { gql, graphql } from "react-apollo";
import mapProps from "recompose/mapProps";
import find from "lodash/find";

import apolloWrapper from "util/apolloWrapper";
import { isDropOffOnly } from "util/domain";

import Timetable from "./timetable";

function filterDepartures(departures, routeSegments) {
    return departures.filter(
        departure =>
            !isDropOffOnly(find(routeSegments, {
                routeId: departure.routeId,
                direction: departure.direction,
            })
        )
    );
}

function groupDepartures(departures) {
    return {
        weekdays: departures.filter(departure => departure.dayType.some(day =>
            ["Ma", "Ti", "Ke", "To", "Pe"].indexOf(day) >= 0)),
        saturdays: departures.filter(departure => departure.dayType.includes("La")),
        sundays: departures.filter(departure => departure.dayType.includes("Su")),
    };
}

function getNotes(routeSegment) {
    return (routeSegment.hasRegularDayDepartures &&
        routeSegment.notes.nodes
            .filter(note => note.noteType.includes("Y"))
            .map(note => note.noteText)) || [];
}

const timetableQuery = gql`
    query timetableQuery($stopId: String!, $date: Date!) {
        stop: stopByStopId(stopId: $stopId) {

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
                }
            }
        }
    }
`;

const propsMapper = mapProps((props) => {
    const { weekdays, saturdays, sundays } = groupDepartures(
        filterDepartures(
            props.data.stop.departures.nodes,
            props.data.stop.routeSegments.nodes
        )
    );
    const notes = new Set(...props.data.stop.routeSegments.nodes.map(getNotes));
    return { weekdays, saturdays, sundays, notes };
});

const TimetableContainer = apolloWrapper(propsMapper)(Timetable);

export default graphql(timetableQuery)(TimetableContainer);
