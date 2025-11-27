import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';
import mean from 'lodash/mean';
import sortBy from 'lodash/sortBy';
import padStart from 'lodash/padStart';
import omit from 'lodash/omit';
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

const roundTo5 = n => {
  return Math.round(n / 5) * 5;
};

const mergeConsecutiveHoursWithSameDepartures = entries => {
  if (!entries.length) return [];

  const merged = [];
  let { hours: startHour, departures: prevDepartures } = entries[0];
  let endHour = startHour;

  for (let i = 1; i < entries.length; i++) {
    const { hours: currentHour, departures } = entries[i];
    const prevHourNum = parseInt(endHour, 10);

    // Compare departures by stringifying
    const sameDepartures = JSON.stringify(departures) === JSON.stringify(prevDepartures);

    if (sameDepartures && parseInt(currentHour, 10) === prevHourNum + 1) {
      endHour = currentHour;
    } else {
      merged.push({
        hours: startHour === endHour ? startHour : `${startHour}-${endHour}`,
        departures: prevDepartures,
      });
      startHour = currentHour;
      endHour = currentHour;
      prevDepartures = departures;
    }
  }

  merged.push({
    hours: startHour === endHour ? startHour : `${startHour}-${endHour}`,
    departures: prevDepartures,
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
  return roundTo5(mean(intervals));
};

export const prepareOrderedDepartureHoursByRoute = departures => {
  const routeIds = new Set();
  const grouped = mapValues(groupBy(departures, 'hours'), hourGroup => {
    const { isNextDay } = hourGroup[0];

    const routes = mapValues(
      groupBy(hourGroup, item => {
        const trimmedRouteId = trimRouteId(item.routeId);
        routeIds.add(trimmedRouteId);
        return trimmedRouteId;
      }),
      routeGroup => calculateAverageInterval(routeGroup.map(item => item.minutes)),
    );

    return {
      isNextDay,
      ...routes,
    };
  });

  const sorted = sortBy(
    Object.entries(grouped),
    ([hourKey, val]) => Number(hourKey) + (val.isNextDay ? 24 : 0),
  ).map(([hours, deps]) => ({
    hours: padHour(hours),
    departures: omit(deps, 'isNextDay'),
  }));

  const result = mergeConsecutiveHoursWithSameDepartures(sorted);

  return { groupedDepartures: result, routeIds: Array.from(routeIds) };
};
