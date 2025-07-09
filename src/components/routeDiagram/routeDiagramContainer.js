import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import flatMap from 'lodash/flatMap';
import sortBy from 'lodash/sortBy';
import { isNumberVariant, trimRouteId, isDropOffOnly, filterRoute } from 'util/domain';
import apolloWrapper from 'util/apolloWrapper';
import { routesToTree } from 'util/routes';

import RouteDiagram from './routeDiagram';

const routeDiagramQuery = gql`
  query routeDiagramQuery($stopIds: [String]!, $date: Date!) {
    stops: getStopsByIds(stopIds: $stopIds) {
      nodes {
        shortId
        stopZone
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
                    trunkRoute
                  }
                }
                route {
                  nodes {
                    mode
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
                      stopZone
                      terminalId
                      stopId
                      routeSegments: routeSegmentsForDate(date: $date) {
                        nodes {
                          routeId
                          hasRegularDayDepartures(date: $date)
                          route {
                            nodes {
                              mode
                            }
                          }
                          line {
                            nodes {
                              lineId
                              trunkRoute
                            }
                          }
                        }
                      }
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
  }
`;

const nodeToStop = ({ stopByStopId }) => {
  const { terminalByTerminalId, ...stop } = stopByStopId;
  if (!terminalByTerminalId) {
    return { ...stop, transferModes: [] };
  }
  const transferModes = flatMap(
    terminalByTerminalId.siblings.nodes,
    // Filter out bus terminals, until we have more specs how to handle those
    sibling => sibling.modes.nodes.filter(mode => mode !== 'BUS'),
  );
  return { ...stop, transferModes };
};

const propsMapper = mapProps(props => {
  const routes = flatMap(props.data.stops.nodes, s =>
    flatMap(s.siblings.nodes, stop =>
      stop.routeSegments.nodes
        // Select regular routes that allow boarding from current stop
        .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
        .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
        .filter(routeSegment => !isDropOffOnly(routeSegment))
        .filter(routeSegment =>
          filterRoute({ routeId: routeSegment.routeId, filter: props.routeFilter }),
        )
        .map(routeSegment => ({
          ...routeSegment.route.nodes[0],
          routeId: trimRouteId(routeSegment.routeId),
          trunkRoute: routeSegment.line.nodes[0].trunkRoute === '1',
          // List all stops (including drop-off only) for each route
          stops: sortBy(routeSegment.nextStops.nodes, node => node.stopIndex).map(nodeToStop),
        })),
    ),
  );
  const treeMaxWidth = props.maxColumns ? props.maxColumns : props.printAsA3 ? 5 : 6; // Defaults 6 for normal posters and 5 for a3 posters.

  const stopDetails = props.data.stops.nodes[0]; // We can use the first one, because the zone should be the same for all in the group.

  return {
    tree: routesToTree(routes, stopDetails, props.height, treeMaxWidth),
    printAsA3: props.printAsA3,
    useWide: props.useWide,
    useCompactLayout: props.useCompactLayout,
  };
});

const hoc = compose(graphql(routeDiagramQuery), apolloWrapper(propsMapper));

const RouteDiagramContainer = hoc(RouteDiagram);

RouteDiagramContainer.defaultProps = {
  useCompactLayout: false,
};

RouteDiagramContainer.propTypes = {
  stopIds: PropTypes.array.isRequired,
  date: PropTypes.string.isRequired,
  useCompactLayout: PropTypes.bool,
};

export default RouteDiagramContainer;
