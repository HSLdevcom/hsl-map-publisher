import { gql, graphql } from "react-apollo";
import mapProps from "recompose/mapProps";
import { isNumberVariant, trimRouteId, isDropOffOnly } from "util/api";
import apolloWrapper from "util/apolloWrapper";
import routeCompare from "util/routeCompare";

import Routes from "./routes";

const routesQuery = gql`
query routesQuery($stopId: String!, $date: Date!) {
    stop: stopByStopId(stopId: $stopId) {
        routeSegments: routeSegmentsForDate(date: $date) {
            nodes {
                routeId
                hasRegularDayDepartures
                pickupDropoffType
                route {
                    nodes {
                        destinationFi
                        destinationSe
                        }
                    }
                }
            }
        }
    }
`;

const propsMapper = mapProps(props => ({
    routes: props.data.stop.routeSegments.nodes
        .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
        .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
        .filter(routeSegment => !isDropOffOnly(routeSegment))
        .map(routeSegment => ({
            routeId: trimRouteId(routeSegment.routeId),
            ...routeSegment.route.nodes[0],
        }))
        .sort(routeCompare),
}));

const RoutesContainer = apolloWrapper(propsMapper)(Routes);

export default graphql(routesQuery)(RoutesContainer);
