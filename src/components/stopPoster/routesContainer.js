import { gql, graphql } from "react-apollo";
import mapProps from "recompose/mapProps";
import flatMap from "lodash/flatMap";

import { isNumberVariant, trimRouteId, isDropOffOnly } from "util/domain";
import apolloWrapper from "util/apolloWrapper";
import routeCompare from "util/routeCompare";

import Routes from "./routes";

const routesQuery = gql`
query routesQuery($stopId: String!, $date: Date!) {
    stop: stopByStopId(stopId: $stopId) {
        siblings {
            nodes {
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
        }
    }
`;

const propsMapper = mapProps(props => ({
    columns: props.columns,
    routes: flatMap(
        props.data.stop.siblings.nodes,
        node => node.routeSegments.nodes
            .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
            .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
            .filter(routeSegment => !isDropOffOnly(routeSegment))
            .map(routeSegment => ({
                ...routeSegment.route.nodes[0],
                routeId: trimRouteId(routeSegment.routeId),
            }))
        ).sort(routeCompare),
}));

const RoutesContainer = apolloWrapper(propsMapper)(Routes);

export default graphql(routesQuery)(RoutesContainer);
