import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import flatMap from 'lodash/flatMap';
import sortBy from 'lodash/sortBy';
import { isNumberVariant, trimRouteId, isDropOffOnly } from 'util/domain';
import apolloWrapper from 'util/apolloWrapper';
import { routesToTree } from 'util/routes';

import RouteDiagram from './routeDiagram';

const routeDiagramQuery = gql`
  query routeDiagramQuery($stopId: String!, $date: Date!) {
    stop: stopByStopId(stopId: $stopId) {
      shortId
      stopZone
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
                    stopZone
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
  const routes = flatMap(props.data.stop.siblings.nodes, stop =>
    stop.routeSegments.nodes
      // Select regular routes that allow boarding from current stop
      .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
      .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
      .filter(routeSegment => !isDropOffOnly(routeSegment))
      .map(routeSegment => ({
        ...routeSegment.route.nodes[0],
        routeId: trimRouteId(routeSegment.routeId),
        // List all stops (including drop-off only) for each route
        stops: sortBy(routeSegment.nextStops.nodes, node => node.stopIndex).map(nodeToStop),
      })),
  );
  return { tree: routesToTree(routes, props.data.stop.shortId, props.height) };
});

const hoc = compose(
  graphql(routeDiagramQuery),
  apolloWrapper(propsMapper),
);

const RouteDiagramContainer = hoc(RouteDiagram);

RouteDiagramContainer.propTypes = {
  stopId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
};

export default RouteDiagramContainer;
