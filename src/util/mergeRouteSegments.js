import mergeWith from 'lodash/mergeWith';

export function mergeRouteSegments(routeSegment, otherSegments = []) {
  if (otherSegments.length === 0) {
    return routeSegment;
  }

  const nextRouteSegment = { ...routeSegment };
  // For some reason route segments are reversed, such that the original stop comes last
  // and the destination is first in the array. Reverse it to restore logic and sanity.
  const otherReversed = otherSegments.reverse();

  for (const segment of otherReversed) {
    mergeWith(nextRouteSegment, segment, (origValue, nextValue) => {
      if (!nextValue) {
        return origValue;
      }

      return nextValue;
    });

    // If the stopId is the same, that means the next segments are in the future of the journey.
    if (segment.stopId === nextRouteSegment.stopId) {
      break;
    }
  }

  return nextRouteSegment;
}
