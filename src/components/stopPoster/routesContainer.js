import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import flatMap from 'lodash/flatMap';

import { isNumberVariant, trimRouteId, isDropOffOnly, filterRoute } from 'util/domain';
import apolloWrapper from 'util/apolloWrapper';
import routeCompare from 'util/routeCompare';

const routesQuery = gql`
  query routesQuery($stopIds: [String], $date: Date!) {
    stops: getStopsByIds(stopIds: $stopIds) {
      nodes {
        platform
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
`;

const propsMapper = mapProps(props => {
  const stops = props.data.stops.nodes;
  return {
    printAsA3: props.printAsA3,
    routes: flatMap(
      stops.map(s =>
        s.routeSegments.nodes
          .map(routeSegment => ({ ...routeSegment, platform: s.platform }))
          .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
          .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
          .filter(routeSegment => !isDropOffOnly(routeSegment))
          .filter(routeSegment =>
            filterRoute({ routeId: routeSegment.routeId, filter: props.routeFilter }),
          ),
      ),
    )
      .map(routeSegment => ({
        ...routeSegment.route.nodes[0],
        viaFi: routeSegment.viaFi,
        viaSe: routeSegment.viaSe,
        routeId: trimRouteId(routeSegment.routeId),
        fullRouteId: routeSegment.routeId,
        platform: routeSegment.platform,
      }))
      .sort(routeCompare),
  };
});

const hoc = compose(graphql(routesQuery), apolloWrapper(propsMapper));

export default component => {
  const RoutesContainer = hoc(component);

  RoutesContainer.propTypes = {
    stopIds: PropTypes.array.isRequired,
    date: PropTypes.string.isRequired,
  };

  return RoutesContainer;
};
