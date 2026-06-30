/**
 * Compute the interval (headway) in minutes using the span formula:
 *
 *   interval = (lastMinute - firstMinute) / (count - 1)
 *
 * firstMinute and lastMinute are the effective endpoints after cross-hour
 * borrowing has been applied:
 *   - borrow previous hour's last departure as (highestMinutes - 60)
 *   - borrow next hour's first departure as (lowestMinutes + 60)
 *
 * Falls back to 60 only when count < 2 and no borrowing is possible.
 *
 * @param {number} firstMinute - effective first minute (may be negative after borrowing)
 * @param {number} lastMinute  - effective last minute (may be > 59 after borrowing)
 * @param {number} count       - number of departures in this hour
 * @returns {number} rounded headway in minutes
 */
const spanInterval = (firstMinute, lastMinute, count) => {
  const gaps = count - 1;
  if (gaps < 1) return 60;
  return Math.round((lastMinute - firstMinute) / gaps);
};

/**
 * Fills in `intervals` for every hour entry in `sorted` using the span
 * formula with cross-hour borrowing.
 *
 * For each hour and each route present in that hour:
 *   - effectiveFirst = previous hour's highestMinutes[route] - 60
 *                      (if previous hour has that route), else lowestMinutes
 *   - effectiveLast  = next hour's lowestMinutes[route] + 60
 *                      (if next hour has that route), else highestMinutes
 *   - interval = (effectiveLast - effectiveFirst) / (allDepartures - 1)
 *     where allDepartures = count of current hour only (the span already
 *     accounts for the borrowed endpoints, not the borrowed departures
 *     themselves).
 *
 * Actually the span covers all gaps including the borrowed ones, so we count
 * the total number of gaps spanned:
 *   gaps = (current count - 1)
 *        + 1 if we borrowed from previous (adds one gap on the left)
 *        + 1 if we borrowed from next     (adds one gap on the right)
 *
 * Mutates `intervals` in place.
 *
 * @param {Array<{
 *   hours: string,
 *   intervals: Object<string, number|null>,
 *   counts: Object<string, number>,
 *   lowestMinutes: Object<string, number>,
 *   highestMinutes: Object<string, number>,
 * }>} sorted - hour entries sorted chronologically
 */
export const calculateIntervals = (sorted) => {
  const allRouteIds = new Set(sorted.flatMap((e) => Object.keys(e.intervals)));

  for (const routeId of allRouteIds) {
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      if (!(routeId in cur.counts)) continue;

      const count = cur.counts[routeId];
      let firstMinute = cur.lowestMinutes[routeId];
      let lastMinute = cur.highestMinutes[routeId];
      let gaps = count - 1;

      // Borrow from previous hour (only if there is one with this route)
      const prev = i > 0 ? sorted[i - 1] : null;
      if (prev && routeId in prev.highestMinutes) {
        firstMinute = prev.highestMinutes[routeId] - 60;
        gaps += 1;
      }

      // Borrow from next hour (only if there is one with this route)
      const next = i < sorted.length - 1 ? sorted[i + 1] : null;
      if (next && routeId in next.lowestMinutes) {
        lastMinute = next.lowestMinutes[routeId] + 60;
        gaps += 1;
      }

      if (gaps < 1) {
        cur.intervals[routeId] = 60;
      } else {
        cur.intervals[routeId] = Math.round((lastMinute - firstMinute) / gaps);
      }
    }
  }
};
