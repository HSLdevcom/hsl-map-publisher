/**
 * Compute the average interval (headway) in minutes.
 *
 * For a full hour use the default windowMinutes=60, which gives 60/count.
 * For the first hour of service pass (60 - firstDepartureMinute) as the window,
 * because the route is only active from that minute to the end of the hour.
 * For the last hour of service pass lastDepartureMinute as the window,
 * because the route is only active from the start of the hour to that minute.
 *
 * @param {number} count - number of departures in the window
 * @param {number} [windowMinutes=60] - effective service window in minutes
 * @returns {number} rounded average headway in minutes, or 60 when count < 2
 */
export const calculateAverageInterval = (count, windowMinutes = 60) => {
  if (count < 2) return 60;
  return Math.round(windowMinutes / count);
};

/**
 * Adjusts the interval for the first and last hour of service for each route.
 *
 * In a middle hour buses are assumed to cover the full 60-minute window, so
 * interval = 60/count.  At the edges this over- or under-estimates the headway:
 *
 *  - First hour: the route starts at lowestMinutes[routeId], so the effective
 *    window is (60 - lowestMinutes[routeId]).
 *  - Last hour: the route ends at highestMinutes[routeId], so the effective
 *    window is highestMinutes[routeId].
 *
 * Mutates the sorted array in place.
 * Routes that only appear in a single hour are left unchanged (default window).
 *
 * @param {Array<{
 *   hours: string,
 *   intervals: Object<string, number>,
 *   counts: Object<string, number>,
 *   lowestMinutes: Object<string, number>,
 *   highestMinutes: Object<string, number>
 * }>} sorted - hour entries sorted chronologically
 */
export const fixFirstLastHourIntervals = (sorted) => {
  const allRouteIds = new Set(sorted.flatMap((e) => Object.keys(e.intervals)));

  for (const routeId of allRouteIds) {
    let firstIdx = -1;
    let lastIdx = -1;

    for (let i = 0; i < sorted.length; i++) {
      if (routeId in sorted[i].intervals) {
        if (firstIdx === -1) firstIdx = i;
        lastIdx = i;
      }
    }

    // Route only appears in a single hour — cannot distinguish first vs last,
    // leave the default (60 / count) unchanged.
    if (firstIdx === -1 || firstIdx === lastIdx) continue;

    // First hour: window starts at the first departure minute
    const first = sorted[firstIdx];
    first.intervals[routeId] = calculateAverageInterval(
      first.counts[routeId],
      60 - first.lowestMinutes[routeId],
    );

    // Last hour: window ends at the last departure minute
    const last = sorted[lastIdx];
    last.intervals[routeId] = calculateAverageInterval(
      last.counts[routeId],
      last.highestMinutes[routeId],
    );
  }
};
