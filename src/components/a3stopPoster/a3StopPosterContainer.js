import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import withProps from 'recompose/withProps';
import flatMap from 'lodash/flatMap';

import apolloWrapper from 'util/apolloWrapper';
import { isNumberVariant, trimRouteId, isDropOffOnly, filterRoute } from 'util/domain';

import A3StopPoster from './a3stopPoster';

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
              line {
                nodes {
                  trunkRoute
                }
              }
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
      .filter(routeSegment => !isDropOffOnly(routeSegment))
      .filter(routeSegment =>
        filterRoute({ routeId: routeSegment.routeId, filter: props.routeFilter }),
      ),
  );

  const routeIds = routeSegments.map(routeSegment => trimRouteId(routeSegment.routeId));
  const modes = flatMap(routeSegments, node => node.route.nodes.map(route => route.mode));

  return {
    shortId: props.data.stop.shortId,
    hasRoutes: routeIds.length > 0,
    isTrunkStop: routeSegments.some(
      routeSegment => routeSegment.line.nodes && routeSegment.line.nodes[0].trunkRoute === '1',
    ),
    isTramStop: modes.some(mode => mode === 'TRAM'),
  };
});

const hoc = compose(graphql(stopPosterQuery), apolloWrapper(propsMapper));

const StopPosterContainer = hoc(A3StopPoster);

StopPosterContainer.propTypes = {
  stopId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
};

export default StopPosterContainer;
