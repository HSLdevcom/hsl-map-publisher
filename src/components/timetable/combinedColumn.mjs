/**
 * For a group with 2+ routes, computes the synthetic "combined" column data.
 * The combined interval is derived by summing the frequencies of all routes in
 * the group and converting back to an interval:
 *   combinedInterval = Math.round(1 / Σ(1 / interval_i))
 * This is equivalent to 60 / totalDepartures, since interval = 60 / count.
 *
 * @param {string[]} groupRouteIds
 * @param {Array<{hours: string, intervals: Object.<string, number|null>}>} groupedDepartures
 * @returns {Array<{hours: string, combinedInterval: number|null}>}
 */
export const computeCombinedColumn = (groupRouteIds, groupedDepartures) => {
  return groupedDepartures.map(({ hours, intervals }) => {
    const vals = groupRouteIds.map((id) => intervals[id]).filter((v) => v != null);
    if (vals.length === 0) return { hours, combinedInterval: null };
    const combinedFrequency = vals.reduce((sum, t) => sum + 1 / t, 0);
    return { hours, combinedInterval: Math.round(1 / combinedFrequency) };
  });
};
