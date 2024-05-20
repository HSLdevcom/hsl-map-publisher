import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import flatMap from 'lodash/flatMap';

import { isNumberVariant, trimRouteId, isDropOffOnly, filterRoute } from 'util/domain';
import apolloWrapper from 'util/apolloWrapper';
import routeCompare from 'util/routeCompare';

const routesQuery = gql`
  query routesQuery($stopId: String!, $date: Date!) {
    stop: stopByStopId(stopId: $stopId) {
      nameFi
      nameSe
      shortId
      stopZone
      siblings {
        nodes {
          routeSegments: routeSegmentsForDate(date: $date) {
            nodes {
              routeId
              viaFi
              viaSe
              hasRegularDayDepartures(date: $date)
              pickupDropoffType
              line {
                nodes {
                  trunkRoute
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

const propsMapper = mapProps((props) => ({
  variables: props.data.variables,
  stop: props.data.stop,
  routes: flatMap(props.data.stop.siblings.nodes, (node) =>
    node.routeSegments.nodes
      .filter((routeSegment) => routeSegment.hasRegularDayDepartures === true)
      .filter((routeSegment) => !isNumberVariant(routeSegment.routeId))
      .filter((routeSegment) => !isDropOffOnly(routeSegment))
      .filter((routeSegment) =>
        filterRoute({ routeId: routeSegment.routeId, filter: props.routeFilter }),
      )
      .map((routeSegment) => ({
        ...routeSegment.route.nodes[0],
        viaFi: routeSegment.viaFi,
        viaSe: routeSegment.viaSe,
        routeId: trimRouteId(routeSegment.routeId),
        fullRouteId: routeSegment.routeId,
        trunkRoute: routeSegment.line.nodes && routeSegment.line.nodes[0].trunkRoute === '1',
      })),
  ).sort(routeCompare),
}));

const hoc = compose(graphql(routesQuery), apolloWrapper(propsMapper));

export default (component) => {
  const A3HeaderContainer = hoc(component);

  A3HeaderContainer.propTypes = {
    stopId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
  };

  return A3HeaderContainer;
};
