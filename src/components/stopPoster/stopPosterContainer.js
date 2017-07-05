import PropTypes from "prop-types";
import { gql, graphql } from "react-apollo";
import compose from "recompose/compose";
import withProps from "recompose/withProps";
import flatMap from "lodash/flatMap";

import apolloWrapper from "util/apolloWrapper";
import { isNumberVariant, trimRouteId, isTrunkRoute, isDropOffOnly } from "util/domain";

import StopPoster from "./stopPoster";

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
                        }
                    }
                }
            }
        }
    }
`;

const propsMapper = withProps(props => ({
    shortId: props.data.stop.shortId,
    isTrunkStop: flatMap(
         props.data.stop.siblings.nodes,
         node => node.routeSegments.nodes
             .filter(routeSegment => routeSegment.hasRegularDayDepartures === true)
             .filter(routeSegment => !isNumberVariant(routeSegment.routeId))
             .filter(routeSegment => !isDropOffOnly(routeSegment))
             .filter(routeSegment => isTrunkRoute(trimRouteId(routeSegment.routeId)))
        ).length > 0,
}));

const hoc = compose(
    graphql(stopPosterQuery),
    apolloWrapper(propsMapper)
);

const StopPosterContainer = hoc(StopPoster);

StopPosterContainer.propTypes = {
    stopId: PropTypes.string.isRequired,
};

export default StopPosterContainer;
