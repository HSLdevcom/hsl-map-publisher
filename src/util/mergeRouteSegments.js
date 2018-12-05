import merge from 'lodash/merge';
import orderBy from 'lodash/orderBy';
import omit from 'lodash/omit';

export function mergeRouteSegments(routeSegment, allRouteSegments = []) {
  if (allRouteSegments.length === 0) {
    return routeSegment;
  }

  const nextRouteSegment = { ...routeSegment };
  const allSegmentsSorted = orderBy(allRouteSegments, 'stopIndex', 'asc');

  for (const segment of allSegmentsSorted) {
    // If the stopIndex is more, that means the next segments are in the future of the journey.
    if (segment.stopIndex > routeSegment.stopIndex) {
      break;
    }

    const relevantData = omit(segment, 'stopId', 'stopIndex');

    if (relevantData.destinationFi) {
      merge(nextRouteSegment, relevantData);
    }
  }

  return nextRouteSegment;
}
