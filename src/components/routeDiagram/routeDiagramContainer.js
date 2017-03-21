import { gql, graphql } from "react-apollo";
import mapProps from "recompose/mapProps";
import { isNumberVariant, trimRouteId } from "util/api";
import apolloWrapper from "util/apolloWrapper";
import { routesToTree } from "util/routes";

import RouteDiagram from "./routeDiagram";

const routeDiagramQuery = gql`
    query routeDiagramQuery($stopId: String!, $date: Date!) {
        stop: stopByStopId(stopId: $stopId) {
            routeSegments: routeSegmentsForDate(date: $date) {
                nodes {
                    routeId
                    hasRegularDayDepartures
                    route {
                        nodes {
                            destinationFi
                            destinationSe
                            }
                        }
                    nextStops {
                        nodes {
                            stopByStopId {
                                nameFi
                                nameSe
                                terminalId
                            }
                        }
                    }
                }
            }
        }
    }
`;

const propsMapper = mapProps(props => ({
    tree: routesToTree(
        props.data.stop.routeSegments.nodes
        .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
        .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
        .map(routeSegment => ({
            routeId: trimRouteId(routeSegment.routeId),
            ...routeSegment.route.nodes[0],
            stops: routeSegment.nextStops.nodes.map(node => node.stopByStopId),
        }))),
}));

const RoutesContainer = apolloWrapper(propsMapper)(RouteDiagram);

export default graphql(routeDiagramQuery)(RoutesContainer);
