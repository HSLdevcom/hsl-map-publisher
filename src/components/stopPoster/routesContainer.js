import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import flatMap from 'lodash/flatMap';
import groupBy from 'lodash/groupBy';
import compact from 'lodash/compact';

import { isNumberVariant, trimRouteId, isDropOffOnly, filterRoute } from 'util/domain';
import apolloWrapper from 'util/apolloWrapper';
import routeCompare from 'util/routeCompare';

const routesQuery = gql`
  query stopPosterQuery($stopId: String!, $date: Date!) {
    stop: stopByStopId(stopId: $stopId) {
      shortId
      siblings {
        nodes {
          platform
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

const propsMapper = mapProps(props => {
  const { data, routeFilter, ...propsToForward } = props;
  const stops = flatMap(
    data.stop.siblings.nodes.map(s =>
      s.routeSegments.nodes
        .map(routeSegment => ({ ...routeSegment, platform: s.platform }))
        .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
        .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
        .filter(routeSegment => !isDropOffOnly(routeSegment))
        .filter(routeSegment =>
          filterRoute({ routeId: routeSegment.routeId, filter: routeFilter }),
        ),
    ),
  );
  const routes = stops.map(routeSegment => ({
    ...routeSegment.route.nodes[0],
    viaFi: routeSegment.viaFi,
    viaSe: routeSegment.viaSe,
    trunkRoute: routeSegment.line.nodes && routeSegment.line.nodes[0].trunkRoute === '1',
    routeId: trimRouteId(routeSegment.routeId),
    fullRouteId: routeSegment.routeId,
    platform: routeSegment.platform,
  }));

  // Group similar routes and place the platforminfo in the list
  const routesGrouped = Object.values(groupBy(routes, r => r.routeId + r.destinationFi))
    .map(r =>
      r.reduce((prev, curr) => ({ ...prev, platforms: prev.platforms.concat(curr.platform) }), {
        ...r[0],
        platforms: [],
      }),
    )
    .map(r => ({ ...r, platforms: compact(r.platforms).sort() }))
    .sort(routeCompare);

  return {
    ...propsToForward,
    routes: routesGrouped,
  };
});

const hoc = compose(graphql(routesQuery), apolloWrapper(propsMapper));

export default component => {
  const RoutesContainer = hoc(component);

  RoutesContainer.propTypes = {
    stopId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
  };

  return RoutesContainer;
};
