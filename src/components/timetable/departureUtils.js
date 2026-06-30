import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import padStart from 'lodash/padStart';
import omit from 'lodash/omit';
import cloneDeep from 'lodash/cloneDeep';
import { trimRouteId } from 'util/domain';
import { normalizeDepartures } from './intervalsNormalizer.mjs';
import { calculateIntervals } from './intervalCalculation.mjs';

export { computeCombinedColumn } from './combinedColumn.mjs';

/**
 * @typedef {Object} DepartureGroup
 * @property {number} hours
 * @property {number} minutes
 * @property {?string} note
 * @property {string} routeId
 * @property {string} direction
 * @property {string[]} dayType
 * @property {boolean} isNextDay
 * @property {boolean} isAccessible
 * @property {string} dateBegin
 * @property {string} dateEnd
 * @property {string} __typename
 */

/**
 * @typedef {Object} HourInterval
 * @property {string} hours - single hour or range like "05-07"
 * @property {number} avgInterval - average interval in minutes, 60 if only one departure
 */

const DEPOT_RUNS_LETTER = 'H';

/**
 * @param {DepartureGroup[]} departures
 * @returns {DepartureGroup[]}
 */
const filterNonDepotDepartures = departures =>
  departures.filter(d => !d.routeId.includes(DEPOT_RUNS_LETTER));

/**
 * @param {number} n
 * @returns {string}
 */
const padHour = n => padStart(String(n), 2, '0');

/**
 * @param {Array<{hours: string, intervals: Object}>} entries
 * @returns {Array<{hours: string, intervals: Object}>}
 */
const mergeConsecutiveHoursWithSameDepartures = entries => {
  if (!entries.length) return [];

  const merged = [];
  let { hours: startHour, intervals: prevIntervals } = entries[0];
  let endHour = startHour;

  for (let i = 1; i < entries.length; i++) {
    const { hours: currentHour, intervals } = entries[i];
    const prevHourNum = parseInt(endHour, 10);

    const sameDepartures = JSON.stringify(intervals) === JSON.stringify(prevIntervals);

    if (sameDepartures && parseInt(currentHour, 10) === prevHourNum + 1) {
      endHour = currentHour;
    } else {
      merged.push({
        hours: startHour === endHour ? startHour : `${startHour}-${endHour}`,
        intervals: prevIntervals,
      });
      startHour = currentHour;
      endHour = currentHour;
      prevIntervals = intervals;
    }
  }

  merged.push({
    hours: startHour === endHour ? startHour : `${startHour}-${endHour}`,
    intervals: prevIntervals,
  });

  return merged;
};

/**
 * @param {DepartureGroup[]} filteredDepartures
 * @param {Set<string>} routeIds
 * @returns {Object<string, {
 *   hours: string,
 *   isNextDay: boolean,
 *   intervals: Object<string, number>,
 *   counts: Object<string, number>,
 *   lowestMinutes: Object<string, number>,
 *   highestMinutes: Object<string, number>
 * }>}
 */
const groupDeparturesByHour = (filteredDepartures, routeIds) => {
  return mapValues(
    groupBy(filteredDepartures, d => `${d.hours}_${d.isNextDay}`),
    hourGroup => {
      const { hours, isNextDay } = hourGroup[0];

      const routeGroups = groupBy(hourGroup, item => {
        const trimmedRouteId = trimRouteId(item.routeId);
        routeIds.add(trimmedRouteId);
        return trimmedRouteId;
      });

      const intervals = {};
      const counts = {};
      const lowestMinutes = {};
      const highestMinutes = {};
      const minutesByRoute = {};

      for (const [routeId, items] of Object.entries(routeGroups)) {
        const minutesArray = items.map(item => item.minutes).sort((a, b) => a - b);
        counts[routeId] = minutesArray.length;
        intervals[routeId] = null; // filled in by calculateIntervals
        [lowestMinutes[routeId]] = minutesArray;
        highestMinutes[routeId] = minutesArray[minutesArray.length - 1];
        minutesByRoute[routeId] = minutesArray;
      }

      return {
        hours: padHour(hours),
        isNextDay,
        intervals,
        counts,
        lowestMinutes,
        highestMinutes,
        minutesByRoute,
      };
    },
  );
};

/**
 * @param {Array<{
 *   hours: string,
 *   isNextDay: boolean,
 *   intervals: Object<string, number>,
 *   lowestMinutes: Object<string, number>,
 *   highestMinutes: Object<string, number>
 * }>} sorted
 * @param {Set<string>} routeIds
 * @returns {{firstDepartures: Object<string, string>,
 *   lastDepartures: Object<string, string>}}
 */
const calculateFirstAndLastDepartures = (sorted, routeIds) => {
  const routeIdsArray = [...routeIds];
  const firstDepartures = {};
  const lastDepartures = {};
  for (let i = 0; i < sorted.length; i++) {
    if (routeIdsArray.every(routeId => routeId in firstDepartures)) {
      break;
    }
    for (const routeId of routeIdsArray) {
      if (!firstDepartures[routeId] && sorted[i].intervals[routeId]) {
        firstDepartures[routeId] = `${sorted[i].hours}:${padHour(
          sorted[i].lowestMinutes[routeId],
        )}`;
      }
    }
  }
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (routeIdsArray.every(routeId => routeId in lastDepartures)) {
      break;
    }
    for (const routeId of routeIdsArray) {
      if (!lastDepartures[routeId] && sorted[i].intervals[routeId]) {
        lastDepartures[routeId] = `${sorted[i].hours}:${padHour(
          sorted[i].highestMinutes[routeId],
        )}`;
      }
    }
  }
  return { firstDepartures, lastDepartures };
};

/**
 * @param {DepartureGroup[]} departures
 * @returns {{
 *   groupedDepartures: Array<{hours: string, intervals: Object}>,
 *   routeIds: string[],
 *   firstDepartures: Object<string, string>,
 *   lastDepartures: Object<string, string>
 * }}
 */
export const prepareOrderedDepartureHoursByRoute = departures => {
  const filteredDepartures = filterNonDepotDepartures(departures);
  const routeIds = new Set();
  const grouped = groupDeparturesByHour(filteredDepartures, routeIds);

  const sorted = Object.values(grouped).sort((a, b) => {
    const aTime = +a.hours + (a.isNextDay ? 24 : 0);
    const bTime = +b.hours + (b.isNextDay ? 24 : 0);
    return aTime - bTime;
  });

  calculateIntervals(sorted);

  const { firstDepartures, lastDepartures } = calculateFirstAndLastDepartures(sorted, routeIds);

  const normalized = normalizeDepartures(sorted);

  const result = mergeConsecutiveHoursWithSameDepartures(normalized);

  return {
    groupedDepartures: result,
    routeIds: Array.from(routeIds),
    firstDepartures,
    lastDepartures,
  };
};

/**
 * Groups route IDs by their mode+trunk combination.
 * Routes in the same group share mode and trunkRoute flag.
 *
 * @param {string[]} routeIds
 * @param {Object.<string, {mode: string, trunkRoute: boolean}>} routeIdToModeMap
 * @returns {Array<{key: string, routeIds: string[], mode: string, trunkRoute: boolean}>}
 *   Ordered list of groups preserving original route order.
 */
export const groupRoutesByModeAndTrunk = (routeIds, routeIdToModeMap) => {
  const groupMap = new Map();
  const groupOrder = [];

  for (const routeId of routeIds) {
    const desc = routeIdToModeMap[routeId];
    if (!desc) continue;
    const key = `${desc.mode}_${desc.trunkRoute ? '1' : '0'}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, routeIds: [], mode: desc.mode, trunkRoute: !!desc.trunkRoute });
      groupOrder.push(key);
    }
    groupMap.get(key).routeIds.push(routeId);
  }

  return groupOrder.map(k => groupMap.get(k));
};
