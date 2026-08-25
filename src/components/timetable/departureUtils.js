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
 * Returns only depot-run departures (routeId contains 'H').
 * @param {DepartureGroup[]} departures
 * @returns {DepartureGroup[]}
 */
export const filterDepotDepartures = departures =>
  departures.filter(d => d.routeId.includes(DEPOT_RUNS_LETTER));

/**
 * @param {number} n
 * @returns {string}
 */
const padHour = n => padStart(String(n), 2, '0');

/**
 * Groups depot departures by hour and returns sorted departure objects per hour.
 * @param {DepartureGroup[]} depotDepartures
 * @returns {Object<string, DepartureGroup[]>} map of padded hour string → departures sorted by minute
 */
export const groupDepotDeparturesByHour = depotDepartures => {
  const byHour = {};
  for (const d of depotDepartures) {
    const hourKey = padHour(d.hours + (d.isNextDay ? 24 : 0));
    if (!byHour[hourKey]) byHour[hourKey] = [];
    byHour[hourKey].push(d);
  }
  for (const key of Object.keys(byHour)) {
    byHour[key] = byHour[key].sort((a, b) => a.minutes - b.minutes);
  }
  return byHour;
};

/**
 * @param {Array<{hours: string, intervals: Object}>} entries
 * @returns {Array<{hours: string, intervals: Object}>}
 */
const mergeConsecutiveHoursWithSameDepartures = entries => {
  if (!entries.length) return [];

  const merged = [];
  let { hours: startHour, intervals: prevIntervals, hasPeNote: prevHasPeNote } = entries[0];
  let endHour = startHour;
  let accumulatedHasPeNote = { ...prevHasPeNote };

  for (let i = 1; i < entries.length; i++) {
    const { hours: currentHour, intervals, hasPeNote } = entries[i];
    const prevHourNum = parseInt(endHour, 10);

    const sameDepartures = JSON.stringify(intervals) === JSON.stringify(prevIntervals);

    if (sameDepartures && parseInt(currentHour, 10) === prevHourNum + 1) {
      endHour = currentHour;
      // OR-combine: if any hour in the merged range has a 'pe' note, mark it
      for (const routeId of Object.keys(hasPeNote)) {
        accumulatedHasPeNote[routeId] = !!accumulatedHasPeNote[routeId] || !!hasPeNote[routeId];
      }
    } else {
      merged.push({
        hours: startHour === endHour ? startHour : `${startHour}-${endHour}`,
        intervals: prevIntervals,
        hasPeNote: accumulatedHasPeNote,
      });
      startHour = currentHour;
      endHour = currentHour;
      prevIntervals = intervals;
      prevHasPeNote = hasPeNote;
      accumulatedHasPeNote = { ...hasPeNote };
    }
  }

  merged.push({
    hours: startHour === endHour ? startHour : `${startHour}-${endHour}`,
    intervals: prevIntervals,
    hasPeNote: accumulatedHasPeNote,
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
      const hasPeNote = {};

      for (const [routeId, items] of Object.entries(routeGroups)) {
        const minutesArray = items.map(item => item.minutes).sort((a, b) => a - b);
        counts[routeId] = minutesArray.length;
        intervals[routeId] = null; // filled in by calculateIntervals
        [lowestMinutes[routeId]] = minutesArray;
        highestMinutes[routeId] = minutesArray[minutesArray.length - 1];
        minutesByRoute[routeId] = minutesArray;
        hasPeNote[routeId] = items.some(item => item.note && item.note.includes('pe'));
      }

      return {
        hours: padHour(hours),
        isNextDay,
        intervals,
        counts,
        lowestMinutes,
        highestMinutes,
        minutesByRoute,
        hasPeNote,
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
 * Natural numeric sort for route IDs: "1" < "2" < "9" < "9N" < "13"
 * Splits each id into numeric and non-numeric parts and compares them in order.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export const compareRouteIds = (a, b) => {
  const tokenize = s => s.match(/(\d+|\D+)/g) || [];
  const ta = tokenize(a);
  const tb = tokenize(b);
  for (let i = 0; i < Math.max(ta.length, tb.length); i++) {
    if (i >= ta.length) return -1;
    if (i >= tb.length) return 1;
    const na = parseInt(ta[i], 10);
    const nb = parseInt(tb[i], 10);
    if (!isNaN(na) && !isNaN(nb)) {
      if (na !== nb) return na - nb;
    } else {
      const cmp = ta[i].localeCompare(tb[i]);
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
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
    routeIds: Array.from(routeIds).sort(compareRouteIds),
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
 *   Ordered list of groups with route IDs sorted numerically within each group.
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

  return groupOrder.map(k => {
    const group = groupMap.get(k);
    group.routeIds.sort(compareRouteIds);
    return group;
  });
};
