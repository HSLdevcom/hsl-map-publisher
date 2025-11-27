import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';
import mean from 'lodash/mean';
import sortBy from 'lodash/sortBy';
import padStart from 'lodash/padStart';
import omit from 'lodash/omit';
import cloneDeep from 'lodash/cloneDeep';
import { trimRouteId } from 'util/domain';
import { normalizeDepartures } from './intervalsNormalizer.mjs';

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

/**
 * @param {number} n
 * @returns {string}
 */
const padHour = n => padStart(String(n), 2, '0');

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
 * @param {number[]} nums
 * @returns {number}
 */ const calculateAverageInterval = nums => {
  if (nums.length < 2) return 60;
  const sorted = [...nums].sort((a, b) => a - b);
  const intervals = sorted.slice(1).map((v, i) => v - sorted[i]);
  return Math.round(mean(intervals));
};

/**
 * @param {DepartureGroup[]} departures
 */
export const prepareOrderedDepartureHoursByRoute = departures => {
  const routeIds = new Set();
  const grouped = mapValues(
    groupBy(departures, d => `${d.hours}_${d.isNextDay}`),
    hourGroup => {
      const { hours, isNextDay } = hourGroup[0];

      const routeGroups = groupBy(hourGroup, item => {
        const trimmedRouteId = trimRouteId(item.routeId);
        routeIds.add(trimmedRouteId);
        return trimmedRouteId;
      });

      const intervals = {};
      const lowestMinutes = {};
      const highestMinutes = {};

      for (const [routeId, items] of Object.entries(routeGroups)) {
        const minutesArray = items.map(item => item.minutes);
        intervals[routeId] = calculateAverageInterval(minutesArray);
        lowestMinutes[routeId] = Math.min(...minutesArray);
        highestMinutes[routeId] = Math.max(...minutesArray);
      }

      return {
        hours: padHour(hours),
        isNextDay,
        intervals,
        lowestMinutes,
        highestMinutes,
      };
    },
  );

  const sorted = Object.values(grouped).sort((a, b) => {
    const aTime = +a.hours + (a.isNextDay ? 24 : 0);
    const bTime = +b.hours + (b.isNextDay ? 24 : 0);
    return aTime - bTime;
  });

  const routeIdsArray = [...routeIds];
  const firstDepartures = {};
  const lastDepartures = {};
  for (let i = 0; i < sorted.length; i++) {
    if (routeIdsArray.every(routeId => routeId in firstDepartures)) {
      break;
    }
    for (const routeId of routeIdsArray) {
      if (firstDepartures[routeId]) {
        break;
      }
      if (sorted[i].intervals[routeId]) {
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
      if (lastDepartures[routeId]) {
        break;
      }
      if (sorted[i].intervals[routeId]) {
        lastDepartures[routeId] = `${sorted[i].hours}:${padHour(sorted[i].lowestMinutes[routeId])}`;
      }
    }
  }

  const normalized = normalizeDepartures(sorted);

  const result = mergeConsecutiveHoursWithSameDepartures(normalized);

  return {
    groupedDepartures: result,
    routeIds: Array.from(routeIds),
    firstDepartures,
    lastDepartures,
  };
};
