import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Row, WrappingRow } from 'components/util';
import InlineSVG from 'components/inlineSVG';
import clockIcon from 'icons/clock.svg';
import { getIcon, getColor, trimRouteId, BUS_MODE } from 'util/domain';
import partition from 'lodash/partition';
import { prepareOrderedDepartureHoursByRoute } from './departureUtils';
import styles from './intervalTimetable.css';
import TableRows from './tableRows';

/**
 * @param {string} hoursRange - e.g., "01-06", "19-03", "01"
 * @returns {boolean} - true if the range spans 5 or more hours
 */
const spansFiveOrMoreHours = hoursRange => {
  const parts = hoursRange.split('-');
  if (parts.length !== 2) return false;
  const start = parseInt(parts[0], 10);
  const end = parseInt(parts[1], 10);
  const span = end < start ? 24 - start + end : end - start;
  return span >= 5;
};

/**
 * @param {Object} routeIdToModeMap
 * @param {string} id
 * @returns {{mode: string, trunkRoute: boolean}}
 */
const getRoute = (routeIdToModeMap, id) => routeIdToModeMap[id];

const IntervalDisplay = ({ departureIntervalsByRoute, routeIdToModeMap, isCompact }) => {
  return (
    <>
      <div
        className={classNames(styles.timetableRoutes, { [styles.compactPaddingRight]: isCompact })}>
        <InlineSVG key="clock_svg" className={styles.icon} src={clockIcon} />
        {departureIntervalsByRoute.routeIds.map(routeId => (
          <div
            key={`route-${routeId}`}
            className={classNames(styles.routeHeadings)}
            style={{
              color: getColor(getRoute(routeIdToModeMap, routeId)),
            }}>
            <InlineSVG
              className={styles.icon}
              src={getIcon({ ...getRoute(routeIdToModeMap, routeId) })}
            />
            {routeId}
          </div>
        ))}
      </div>
      <div
        className={classNames(styles.firstAndLastDepartures, {
          [styles.compactPaddingRight]: isCompact,
        })}>
        <div className={styles.departureTitles}>
          <span>Ensimmäinen</span>
          <span>Första</span>
          <span>First</span>
        </div>
        {departureIntervalsByRoute.routeIds.map(routeId => (
          <div className={styles.firstAndLastDepartureValues}>
            {departureIntervalsByRoute.firstDepartures[routeId]}
          </div>
        ))}
      </div>
      <div className={styles.timetableRoot}>
        {departureIntervalsByRoute.groupedDepartures.map(({ hours, intervals }) => {
          const isLongInterval = spansFiveOrMoreHours(hours);
          return (
            <Row
              className={classNames(styles.timetableMinutes, {
                [styles.timetableMinutesNonCompact]: !isCompact,
                [styles.timetableMinutesLong]: isLongInterval,
              })}>
              <div
                className={classNames(styles.hours, {
                  [styles.hoursLong]: isLongInterval,
                })}>
                {hours}
              </div>
              {departureIntervalsByRoute.routeIds.map(routeId => (
                <WrappingRow style={{ justifyContent: 'center' }}>
                  <div
                    className={classNames(styles.interval, {
                      [styles.intervalLong]: isLongInterval,
                    })}>
                    {intervals[routeId] ? `${intervals[routeId]} min` : '-'}
                  </div>
                </WrappingRow>
              ))}
            </Row>
          );
        })}
      </div>
      <div
        className={classNames(styles.firstAndLastDepartures, {
          [styles.compactPaddingRight]: isCompact,
        })}>
        <div className={styles.departureTitles}>
          <span>Viimeinen</span>
          <span>Sista</span>
          <span>Last</span>
        </div>
        {departureIntervalsByRoute.routeIds.map(routeId => (
          <div className={styles.firstAndLastDepartureValues}>
            {departureIntervalsByRoute.lastDepartures[routeId]}
          </div>
        ))}
      </div>
    </>
  );
};

IntervalDisplay.propTypes = {
  departureIntervalsByRoute: PropTypes.object.isRequired,
  routeIdToModeMap: PropTypes.object.isRequired,
  isCompact: PropTypes.bool,
};

IntervalDisplay.defaultProps = {
  isCompact: false,
};

const partitionToIntervalAndNonIntervalRoutes = routeIdToModeMap => {
  const intervalRoutes = new Set();
  const normalBusRoutes = new Set();

  for (const key in routeIdToModeMap) {
    const routeDescription = routeIdToModeMap[key];
    if (routeDescription.mode === BUS_MODE && !routeDescription.trunkRoute) {
      normalBusRoutes.add(key);
    } else {
      intervalRoutes.add(key);
    }
  }

  return { intervalRoutes, normalBusRoutes };
};

const sortBusRoutesLast = (routeIds, routeIdToModeMap) => {
  routeIds.sort((a, b) => {
    const aIsBus = routeIdToModeMap[a]?.mode === BUS_MODE;
    const bIsBus = routeIdToModeMap[b]?.mode === BUS_MODE;
    if (aIsBus === bIsBus) return a.localeCompare(b);
    return aIsBus ? 1 : -1;
  });
};

const IntervalTimetable = ({ routeIdToModeMap, departures }) => {
  const { intervalRoutes, normalBusRoutes } = partitionToIntervalAndNonIntervalRoutes(
    routeIdToModeMap,
  );

  const [nonBusDepartures, busDepartures] = partition(departures, it =>
    intervalRoutes.has(trimRouteId(it.routeId).replace(/[^0-9]/g, '')),
  );

  const departureIntervalsByRoute = prepareOrderedDepartureHoursByRoute(nonBusDepartures);

  sortBusRoutesLast(departureIntervalsByRoute.routeIds, routeIdToModeMap);

  return busDepartures.length > 0 ? (
    <div className={styles.flexContainer}>
      <div className={styles.leftPanel} style={{ minWidth: `${70 + intervalRoutes.size * 60}px` }}>
        <IntervalDisplay
          departureIntervalsByRoute={departureIntervalsByRoute}
          intervalRoutes={intervalRoutes}
          normalBusRoutes={normalBusRoutes}
          routeIdToModeMap={routeIdToModeMap}
          isCompact={false}
        />
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.busRoutesContainer}>
          <InlineSVG key="clock_svg" className={styles.icon} src={clockIcon} />
          <div className={styles.routeHeadings} style={{ color: getColor({ mode: BUS_MODE }) }}>
            <InlineSVG className={styles.icon} src={getIcon({ mode: BUS_MODE })} />
            {Array.from(normalBusRoutes).join(', ')}
          </div>
        </div>
        <TableRows noPadLeft={busDepartures.length > 0} departures={busDepartures} />
      </div>
    </div>
  ) : (
    <IntervalDisplay
      departureIntervalsByRoute={departureIntervalsByRoute}
      intervalRoutes={intervalRoutes}
      normalBusRoutes={normalBusRoutes}
      routeIdToModeMap={routeIdToModeMap}
      isCompact
    />
  );
};

IntervalTimetable.propTypes = {
  combinedDay: PropTypes.string.isRequired,
  routeIdToModeMap: PropTypes.object.isRequired,
  departures: PropTypes.array.isRequired,
  intervalTimetable: PropTypes.bool,
  printableAsA4: PropTypes.bool,
  useCompactLayout: PropTypes.bool,
};

IntervalTimetable.defaultProps = {
  intervalTimetable: false,
  printableAsA4: false,
  useCompactLayout: false,
};

export default IntervalTimetable;
