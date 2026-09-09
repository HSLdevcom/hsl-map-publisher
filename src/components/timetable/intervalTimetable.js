import React from 'react';
import PropTypes from 'prop-types';

import classNames from 'classnames';

import InlineSVG from 'components/inlineSVG';
import clockIcon from 'icons/clock.svg';
import { getIcon, getColor, trimRouteId, BUS_MODE } from 'util/domain';
import partition from 'lodash/partition';
import groupBy from 'lodash/groupBy';
import {
  prepareOrderedDepartureHoursByRoute,
  groupRoutesByModeAndTrunk,
  computeCombinedColumn,
  compareRouteIds,
  groupDepotDeparturesByHour,
  DEPOT_RUNS_LETTER,
} from './departureUtils';
import TableRows, {
  getDuplicateCutOff,
  filterDuplicateDepartureHours,
  Departure,
} from './tableRows';
import styles from './intervalTimetable.css';
import tableRowsStyles from './tableRows.css';

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

const IntervalDisplay = ({
  departureIntervalsByRoute,
  routeIdToModeMap,
  isCompact,
  depotDeparturesByHour,
}) => {
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
              <span>Först. First</span>
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
              <span>Sist. Last</span>
            </div>
          </div>
        </div>

        {/* Route groups + depot column appended inside the last group */}
        <div
          className={styles.routeGroupsContainer}
          style={
            columnGroups.length === 1 && !depotDeparturesByHour
              ? { justifyContent: 'flex-start' }
              : undefined
          }>
          {columnGroups.map((group, groupIdx) => {
            const groupColor = getColor({ mode: group.mode, trunkRoute: group.trunkRoute });
            const hasCombined = group.routeIds.length >= 1;
            const combinedIntervals = hasCombined
              ? computeCombinedColumn(group.routeIds, groupedDepartures)
              : null;
            const isLastGroup = groupIdx === columnGroups.length - 1;

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
                    {groupedDepartures.map(({ hours, intervals, hasPeNote }) => (
                      <div
                        key={hours}
                        className={styles.intervalCell}
                        style={{ height: INTERVAL_ROW_HEIGHT }}>
                        <span className={styles.interval}>
                          {intervals[routeId]
                            ? `${intervals[routeId]} min${
                                hasPeNote && hasPeNote[routeId] ? ' (pe)' : ''
                              }`
                            : '-'}
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
                {/* Depot H column — appended inside the last route group's border */}
                {isLastGroup && depotDeparturesByHour && (
                  <div
                    className={classNames(styles.routeColumn, styles.depotColumn)}
                    style={{ '--depot-separator-color': groupColor }}>
                    <div className={styles.headingCell} style={{ height: HEADING_ROW_HEIGHT }}>
                      <div className={styles.routeHeadings} style={{ color: '#555' }}>
                        H
                      </div>
                    </div>
                    <div
                      className={styles.departureCell}
                      style={{ height: DEPARTURE_ROW_HEIGHT }}
                    />
                    {groupedDepartures.map(({ hours }) => {
                      const lookupHour = hours.split('-')[0];
                      const deps = depotDeparturesByHour[lookupHour];
                      return (
                        <div
                          key={hours}
                          className={styles.intervalCell}
                          style={{ height: INTERVAL_ROW_HEIGHT }}>
                          <div className={styles.depotMinutes}>
                            {deps && deps.length > 0
                              ? deps.map((d, i) => (
                                  <Departure
                                    key={i}
                                    minutes={d.minutes}
                                    routeId={d.routeId}
                                    note={d.note}
                                  />
                                ))
                              : null}
                          </div>
                        </div>
                      );
                    })}
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
  depotDeparturesByHour: PropTypes.object,
};

IntervalDisplay.defaultProps = {
  isCompact: false,
  depotDeparturesByHour: null,
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

/**
 * Estimates the rendered height of a bus timetable by counting visible rows
 * and how many wrap-lines each row produces based on its departure count.
 *
 * Each departure item is ~56px wide (min-width: 3.75em at 15px font). The right
 * panel is min-width 300px; the hours column takes ~70px, leaving ~230px for
 * departure items → roughly 4 items fit per line before wrapping.
 *
 * Returns a unitless height score comparable to the interval table's row count
 * (where each interval row is one unit tall).
 */
const ITEMS_PER_LINE = 4;

const estimateBusHeight = departures => {
  const departuresByHour = groupBy(departures, d => (d.isNextDay ? 24 : 0) + d.hours);
  const rows = Object.entries(departuresByHour).map(([hours, deps]) => ({
    hour: hours,
    departures: deps,
  }));
  const rowsByHour = [];
  for (let i = 0; i < rows.length; i++) {
    const cutOff = getDuplicateCutOff(i, rows);
    rowsByHour.push({ hour: rows[i].hour, departures: rows[i].departures });
    i = cutOff;
  }
  return filterDuplicateDepartureHours(rowsByHour).reduce(
    (sum, row) => sum + Math.ceil(row.departures.length / ITEMS_PER_LINE),
    0,
  );
};

// Depot routeIds carry a trailing depot letter (e.g. "1017H") on top of their
// real route's id, which breaks a plain trimRouteId/intervalRoutes lookup.
// Strip the trailing depot letter first so we can tell which "real" route a
// depot departure belongs to.
const getBaseRouteId = routeId => routeId.replace(new RegExp(`${DEPOT_RUNS_LETTER}$`), '');

const IntervalTimetable = ({ routeIdToModeMap, departures, showDepotRuns }) => {
  const { intervalRoutes, normalBusRoutes } = partitionToIntervalAndNonIntervalRoutes(
    routeIdToModeMap,
  );

  const [depotDepartures, plainDepartures] = partition(departures, it =>
    it.routeId.includes(DEPOT_RUNS_LETTER),
  );

  // Only depot runs whose base routeId is confirmed to be a normal bus route
  // belong in the bus table below, in that route's own row, like any other
  // departure. Everything else — depot runs belonging to an interval-eligible
  // route (trunk bus, tram, metro, rail), AND depot runs whose base routeId
  // doesn't match any known route at all (e.g. "HE"-style ids that don't
  // parse cleanly yet) — default to the interval display's shared "H" column,
  // since we're already generating an interval timetable here.
  // TODO: fix getBaseRouteId to correctly parse all depot routeId formats
  // (e.g. "100HE4"/"100HE5" don't fit the "route + H + variant digit" shape),
  // then this fallback can be removed/tightened.
  const [busDepotDepartures, intervalDepotDepartures] = partition(depotDepartures, it =>
    normalBusRoutes.has(trimRouteId(getBaseRouteId(it.routeId))),
  );

  const [nonBusDepartures, plainBusDepartures] = partition(plainDepartures, it =>
    intervalRoutes.has(trimRouteId(it.routeId)),
  );

  // Reunite bus-route depot departures with the rest of their route's
  // departures so they render in their own row in the bus table, instead of
  // being lumped into the interval display's shared "H" column.
  const busDepartures = showDepotRuns
    ? [...plainBusDepartures, ...busDepotDepartures]
    : plainBusDepartures;

  const departureIntervalsByRoute = prepareOrderedDepartureHoursByRoute(nonBusDepartures);
  sortBusRoutesLast(departureIntervalsByRoute.routeIds, routeIdToModeMap);

  const depotDeparturesByHour = showDepotRuns
    ? groupDepotDeparturesByHour(intervalDepotDepartures)
    : null;

  if (busDepartures.length === 0) {
    return (
      <IntervalDisplay
        departureIntervalsByRoute={departureIntervalsByRoute}
        routeIdToModeMap={routeIdToModeMap}
        isCompact
        depotDeparturesByHour={depotDeparturesByHour}
      />
    );
  }

  const intervalRowCount = departureIntervalsByRoute.groupedDepartures.length;
  const busHeight = estimateBusHeight(busDepartures);
  const stackBelow = busHeight > intervalRowCount;

  return (
    <div className={classNames(styles.flexContainer, { [styles.stackedLayout]: stackBelow })}>
      <div className={stackBelow ? styles.topPanel : styles.leftPanel}>
        <IntervalDisplay
          departureIntervalsByRoute={departureIntervalsByRoute}
          routeIdToModeMap={routeIdToModeMap}
          isCompact={false}
          depotDeparturesByHour={depotDeparturesByHour}
        />
      </div>
      <div className={stackBelow ? styles.bottomPanel : styles.rightPanel}>
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
  );
};

IntervalTimetable.propTypes = {
  combinedDay: PropTypes.string.isRequired,
  routeIdToModeMap: PropTypes.object.isRequired,
  departures: PropTypes.array.isRequired,
  intervalTimetable: PropTypes.bool,
  printableAsA4: PropTypes.bool,
  useCompactLayout: PropTypes.bool,
  showDepotRuns: PropTypes.bool,
};

IntervalTimetable.defaultProps = {
  intervalTimetable: false,
  printableAsA4: false,
  useCompactLayout: false,
  showDepotRuns: false,
};

export default IntervalTimetable;
