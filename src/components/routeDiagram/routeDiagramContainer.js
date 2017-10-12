import { gql, graphql } from "react-apollo";
import mapProps from "recompose/mapProps";
import flatMap from "lodash/flatMap";
import sortBy from "lodash/sortBy";
import { isNumberVariant, trimRouteId, isDropOffOnly } from "util/domain";
import apolloWrapper from "util/apolloWrapper";
import { routesToTree } from "util/routes";

import RouteDiagram from "./routeDiagram";

const routeDiagramQuery = gql`
    query routeDiagramQuery($stopId: String!, $date: Date!) {
        stop: stopByStopId(stopId: $stopId) {
            shortId
            siblings {
                nodes {
                    routeSegments: routeSegmentsForDate(date: $date) {
                        nodes {
                            routeId
                            hasRegularDayDepartures(date: $date)
                            pickupDropoffType
                            route {
                                nodes {
                                    destinationFi
                                    destinationSe
                                }
                            }
                            nextStops {
                                nodes {
                                    stopIndex
                                    stopByStopId {
                                        nameFi
                                        nameSe
                                        shortId
                                        terminalId
                                        terminalByTerminalId {
                                            siblings {
                                                nodes {
                                                    modes(date: $date) {
                                                        nodes
                                                    }
                                                }
                                            }
                                        }
                                    }
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
    tree: routesToTree(flatMap(
        props.data.stop.siblings.nodes, stop => stop.routeSegments.nodes
        .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
        .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
        .filter(routeSegment => !isDropOffOnly(routeSegment))
        .map(routeSegment => ({
            routeId: trimRouteId(routeSegment.routeId),
            ...routeSegment.route.nodes[0],
            stops: sortBy(routeSegment.nextStops.nodes, node => node.stopIndex)
                .map(node => node.stopByStopId),
        }))), props.data.stop.shortId),
}));

const RoutesContainer = apolloWrapper(propsMapper)(RouteDiagram);

export default graphql(routeDiagramQuery)(RoutesContainer);
