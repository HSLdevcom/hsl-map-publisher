import { gql, graphql } from "react-apollo";
import mapProps from "recompose/mapProps";
import flatMap from "lodash/flatMap";
import uniqBy from "lodash/uniqBy";

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
                        hasRegularDayDepartures(date: $date)
                        pickupDropoffType
                        line {
                            nodes {
                                lineId
                            }
                        }
                        route {
                            nodes {
                                destinationFi
                                destinationSe
                                mode
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
    routes: uniqBy(
        flatMap(props.data.stop.siblings.nodes, node =>
            node.routeSegments.nodes
                .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
                .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
                .filter(routeSegment => !isDropOffOnly(routeSegment))
                .map(routeSegment => ({
                    ...routeSegment.route.nodes[0],
                    ...routeSegment.line.nodes[0],
                    routeId: trimRouteId(routeSegment.routeId),
                }))).sort(routeCompare),
        routeSegment => `${routeSegment.lineId} ${routeSegment.destinationFi}`
    ),
}));

const RoutesContainer = apolloWrapper(propsMapper)(Routes);

export default graphql(routesQuery)(RoutesContainer);
