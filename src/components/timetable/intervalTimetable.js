import React from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';

import InlineSVG from 'components/inlineSVG';
import clockIcon from 'icons/clock.svg';
import { getIcon, getColor, trimRouteId, BUS_MODE } from 'util/domain';
import partition from 'lodash/partition';
import {
  prepareOrderedDepartureHoursByRoute,
  groupRoutesByModeAndTrunk,
  computeCombinedColumn,
  compareRouteIds,
} from './departureUtils';
import styles from './intervalTimetable.css';
import tableRowsStyles from './tableRows.css';
import TableRows from './tableRows';

const INTERVAL_ROW_HEIGHT = 26;
const HEADING_ROW_HEIGHT = 44;
const DEPARTURE_ROW_HEIGHT = 28;

const getRoute = (routeIdToModeMap, id) => routeIdToModeMap[id];

/**
 * Background stripe layer — absolutely fills the container, padded to align
 * with the interval rows in the column layout above/below.
 */
const StripeBackground = ({ groupedDepartures, paddingTop }) => {
  const rows = [
    { key: 'first', height: DEPARTURE_ROW_HEIGHT },
    ...groupedDepartures.map(({ hours }) => ({
      key: hours,
      height: INTERVAL_ROW_HEIGHT,
    })),
    { key: 'last', height: DEPARTURE_ROW_HEIGHT },
  ];
  return (
    <div className={styles.stripeBackground} style={{ paddingTop }}>
      {rows.map(({ key, height }, rowIdx) => (
        <div
          key={key}
          className={classNames(styles.stripeRow, { [styles.stripeRowAlt]: rowIdx % 2 === 0 })}
          style={{ height }}
        />
      ))}
    </div>
  );
};

StripeBackground.propTypes = {
  groupedDepartures: PropTypes.array.isRequired,
  paddingTop: PropTypes.number.isRequired,
};

const IntervalDisplay = ({ departureIntervalsByRoute, routeIdToModeMap, isCompact }) => {
  const {
    groupedDepartures,
    routeIds,
    firstDepartures,
    lastDepartures,
  } = departureIntervalsByRoute;

  const columnGroups = groupRoutesByModeAndTrunk(routeIds, routeIdToModeMap);

  return (
    <div className={styles.intervalDisplay}>
      {/* Stripe background — absolutely fills the container, offset by fixed row heights */}
      <StripeBackground groupedDepartures={groupedDepartures} paddingTop={HEADING_ROW_HEIGHT} />

      {/* Column layout — on top of stripes */}
      <div className={styles.columnLayout}>
        {/* Hours column */}
        <div className={styles.hoursColumn}>
          <div className={styles.headingCell} style={{ height: HEADING_ROW_HEIGHT }}>
            <InlineSVG className={styles.icon} src={clockIcon} />
          </div>
          <div className={styles.labelCell} style={{ height: DEPARTURE_ROW_HEIGHT }}>
            <div className={styles.departureTitles}>
              <span>Ens.</span>
              <span>Först. / First</span>
            </div>
          </div>
          {groupedDepartures.map(({ hours }) => (
            <div
              key={hours}
              className={styles.intervalHoursCell}
              style={{ height: INTERVAL_ROW_HEIGHT }}>
              {hours}
            </div>
          ))}
          <div className={styles.labelCell} style={{ height: DEPARTURE_ROW_HEIGHT }}>
            <div className={styles.departureTitles}>
              <span>Viim.</span>
              <span>Sist. / Last</span>
            </div>
          </div>
        </div>

        {/* Route groups */}
        <div className={styles.routeGroupsContainer}>
          {columnGroups.map(group => {
            const groupColor = getColor({ mode: group.mode, trunkRoute: group.trunkRoute });
            const hasCombined = group.routeIds.length >= 1;
            const combinedIntervals = hasCombined
              ? computeCombinedColumn(group.routeIds, groupedDepartures)
              : null;

            return (
              <div
                key={group.key}
                className={classNames(styles.routeGroup, {
                  [styles.routeGroupBordered]: hasCombined,
                })}
                style={hasCombined ? { borderColor: groupColor } : undefined}>
                {group.routeIds.map(routeId => (
                  <div key={routeId} className={styles.routeColumn}>
                    <div className={styles.headingCell} style={{ height: HEADING_ROW_HEIGHT }}>
                      <div className={styles.routeHeadings} style={{ color: groupColor }}>
                        <InlineSVG
                          className={styles.icon}
                          src={getIcon(getRoute(routeIdToModeMap, routeId))}
                        />
                        {routeId}
                      </div>
                    </div>
                    <div className={styles.departureCell} style={{ height: DEPARTURE_ROW_HEIGHT }}>
                      {firstDepartures[routeId] || ''}
                    </div>
                    {groupedDepartures.map(({ hours, intervals }) => (
                      <div
                        key={hours}
                        className={styles.intervalCell}
                        style={{ height: INTERVAL_ROW_HEIGHT }}>
                        <span className={styles.interval}>
                          {intervals[routeId] ? `${intervals[routeId]} min` : '-'}
                        </span>
                      </div>
                    ))}
                    <div className={styles.departureCell} style={{ height: DEPARTURE_ROW_HEIGHT }}>
                      {lastDepartures[routeId] || ''}
                    </div>
                  </div>
                ))}
                {hasCombined && (
                  <div
                    className={classNames(styles.routeColumn, styles.combinedColumn)}
                    style={{ '--combined-separator-color': groupColor }}>
                    <div className={styles.headingCell} style={{ height: HEADING_ROW_HEIGHT }}>
                      <div className={styles.routeHeadings}>
                        <span className={styles.combinedHeading}>
                          <span>Vuoroväli</span>
                          <span>Turtäthet</span>
                          <span>Headway</span>
                        </span>
                      </div>
                    </div>
                    <div
                      className={styles.departureCell}
                      style={{ height: DEPARTURE_ROW_HEIGHT }}
                    />
                    {combinedIntervals.map(({ hours, combinedInterval }) => (
                      <div
                        key={hours}
                        className={styles.intervalCell}
                        style={{ height: INTERVAL_ROW_HEIGHT }}>
                        <span className={styles.interval}>
                          {combinedInterval ? `${combinedInterval} min` : '-'}
                        </span>
                      </div>
                    ))}
                    <div
                      className={styles.departureCell}
                      style={{ height: DEPARTURE_ROW_HEIGHT }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
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

export const partitionToIntervalAndNonIntervalRoutes = routeIdToModeMap => {
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
    if (aIsBus === bIsBus) return compareRouteIds(a, b);
    return aIsBus ? 1 : -1;
  });
};

const IntervalTimetable = ({ routeIdToModeMap, departures }) => {
  const { intervalRoutes, normalBusRoutes } = partitionToIntervalAndNonIntervalRoutes(
    routeIdToModeMap,
  );

  const [nonBusDepartures, busDepartures] = partition(departures, it =>
    intervalRoutes.has(trimRouteId(it.routeId)),
  );

  const departureIntervalsByRoute = prepareOrderedDepartureHoursByRoute(nonBusDepartures);

  sortBusRoutesLast(departureIntervalsByRoute.routeIds, routeIdToModeMap);

  return busDepartures.length > 0 ? (
    <div className={styles.flexContainer}>
      <div className={styles.leftPanel}>
        <IntervalDisplay
          departureIntervalsByRoute={departureIntervalsByRoute}
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
        <TableRows className={tableRowsStyles.inset} departures={busDepartures} />
      </div>
    </div>
  ) : (
    <IntervalDisplay
      departureIntervalsByRoute={departureIntervalsByRoute}
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
