import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import flatMap from 'lodash/flatMap';

import { isNumberVariant, trimRouteId, isDropOffOnly } from 'util/domain';
import apolloWrapper from 'util/apolloWrapper';
import routeCompare from 'util/routeCompare';

import Routes from './routes';

const routesQuery = gql`
  query routesQuery($stopId: String!, $date: Date!) {
    stop: stopByStopId(stopId: $stopId) {
      siblings {
        nodes {
          routeSegments: routeSegmentsForDate(date: $date) {
            nodes {
              routeId
              viaFi
              viaSe
              hasRegularDayDepartures(date: $date)
              pickupDropoffType
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
  routes: flatMap(props.data.stop.siblings.nodes, node =>
    node.routeSegments.nodes
      .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
      .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
      .filter(routeSegment => !isDropOffOnly(routeSegment))
      .map(routeSegment => ({
        ...routeSegment.route.nodes[0],
        viaFi: routeSegment.viaFi,
        viaSe: routeSegment.viaSe,
        routeId: trimRouteId(routeSegment.routeId),
      })),
  ).sort(routeCompare),
}));

const hoc = compose(
  graphql(routesQuery),
  apolloWrapper(propsMapper),
);

const RoutesContainer = hoc(Routes);

RoutesContainer.propTypes = {
  stopId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
};

export default RoutesContainer;
