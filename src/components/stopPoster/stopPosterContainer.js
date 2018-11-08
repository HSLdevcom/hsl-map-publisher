import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import withProps from 'recompose/withProps';
import flatMap from 'lodash/flatMap';

import apolloWrapper from 'util/apolloWrapper';
import { isNumberVariant, trimRouteId, isTrunkRoute, isDropOffOnly } from 'util/domain';

import StopPoster from './stopPoster';

const stopPosterQuery = gql`
  query stopPosterQuery($stopId: String!, $date: Date!) {
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

const propsMapper = withProps(props => {
  const routeSegments = flatMap(props.data.stop.siblings.nodes, node =>
    node.routeSegments.nodes
      .filter(routeSegment => routeSegment.hasRegularDayDepartures)
      .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
      .filter(routeSegment => !isDropOffOnly(routeSegment)),
  );

  const routeIds = routeSegments.map(routeSegment => trimRouteId(routeSegment.routeId));
  const modes = flatMap(routeSegments, node => node.route.nodes.map(route => route.mode));

  return {
    shortId: props.data.stop.shortId,
    hasRoutes: routeIds.length > 0,
    isTrunkStop: routeIds.some(routeId => isTrunkRoute(routeId)),
    isTramStop: modes.every(mode => mode === 'TRAM'),
  };
});

const hoc = compose(
  graphql(stopPosterQuery),
  apolloWrapper(propsMapper),
);

const StopPosterContainer = hoc(StopPoster);

StopPosterContainer.propTypes = {
  stopId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
};

export default StopPosterContainer;
