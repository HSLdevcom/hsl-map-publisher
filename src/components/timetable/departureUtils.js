import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';
import mean from 'lodash/mean';
import sortBy from 'lodash/sortBy';
import padStart from 'lodash/padStart';
import { trimRouteId } from 'util/domain';

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

/**
 * Merge consecutive hours with the same avgInterval
 * @param {HourInterval[]} entries
 * @returns {HourInterval[]}
 */
const mergeConsecutiveHoursWithSameInterval = entries => {
  if (!entries.length) return [];

  const merged = [];
  let { hours: startHour, avgInterval: prevValue } = entries[0];
  let endHour = startHour;

  for (let i = 1; i < entries.length; i++) {
    const { hours: currentHour, avgInterval } = entries[i];
    const prevHourNum = parseInt(endHour, 10);

    if (avgInterval === prevValue && parseInt(currentHour, 10) === prevHourNum + 1) {
      endHour = currentHour;
    } else {
      merged.push({
        hours: startHour === endHour ? startHour : `${startHour}-${endHour}`,
        avgInterval: prevValue,
      });
      startHour = currentHour;
      endHour = currentHour;
      prevValue = avgInterval;
    }
  }

  merged.push({
    hours: startHour === endHour ? startHour : `${startHour}-${endHour}`,
    avgInterval: prevValue,
  });

  return merged;
};

/**
 * @param {number[]} nums
 * @returns {number}
 */
const calculateAverageInterval = nums => {
  if (nums.length < 2) return 60;
  const sorted = [...nums].sort((a, b) => a - b);
  const intervals = sorted.slice(1).map((v, i) => v - sorted[i]);
  return Math.round(mean(intervals));
};

/**
 * @param {DepartureGroup[]} departures
 * @returns {{ [routeId: string]: { hour: number, avgInterval: number, isNextDay: boolean }[] }}
 */
const departuresToRouteGroupedHourlyIntervals = departures => {
  const byRoute = groupBy(departures, d => trimRouteId(d.routeId).trim());

  return mapValues(byRoute, routeDeps => {
    const byHour = groupBy(routeDeps, d => d.hours);

    return Object.entries(byHour).map(([hour, group]) => ({
      hour: +hour,
      avgInterval: calculateAverageInterval(group.map(d => d.minutes)),
      isNextDay: group.some(d => d.isNextDay),
    }));
  });
};

/**
 * @param {DepartureGroup[]} departures
 * @returns {{ [routeId: string]: HourInterval[] }}
 */
export const prepareOrderedDepartureHoursByRoute = departures => {
  const groupedHourlyIntervals = departuresToRouteGroupedHourlyIntervals(departures);

  for (const key of Object.keys(groupedHourlyIntervals)) {
    const sortedIntervals = sortBy(groupedHourlyIntervals[key], ['isNextDay', 'hour']);
    const padded = sortedIntervals.map(({ hour, avgInterval }) => ({
      hours: padHour(hour),
      avgInterval,
    }));
    groupedHourlyIntervals[key] = mergeConsecutiveHoursWithSameInterval(padded);
  }

  return groupedHourlyIntervals;
};
