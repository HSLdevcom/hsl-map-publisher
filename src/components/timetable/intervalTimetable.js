import React from 'react';
import PropTypes from 'prop-types';
import { Row, WrappingRow } from 'components/util';
import InlineSVG from 'components/inlineSVG';
import clockIcon from 'icons/clock.svg';
import { getIcon, getColor, trimRouteId } from 'util/domain';
import partition from 'lodash/partition';
import { prepareOrderedDepartureHoursByRoute } from './departureUtils';
import styles from './intervalTimetable.css';
import TableRows from './tableRows';

const partitionToIntervalAndNonIntervalRoutes = routeIdToModeMap => {
  const intervalRoutes = new Set();
  const normalBusRoutes = new Set();

  for (const key in routeIdToModeMap) {
    const routeDescription = routeIdToModeMap[key];
    if (routeDescription.mode === 'BUS' && !routeDescription.trunkRoute) {
      normalBusRoutes.add(key);
    } else {
      intervalRoutes.add(key);
    }
  }

  return { intervalRoutes, normalBusRoutes };
};

const sortBusRoutesLast = (routeIds, routeIdToModeMap) => {
  routeIds.sort((a, b) => {
    const aIsBus = routeIdToModeMap[a]?.mode === 'BUS';
    const bIsBus = routeIdToModeMap[b]?.mode === 'BUS';
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

  const getRoute = id => routeIdToModeMap[id];

  return busDepartures.length > 0 ? (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 'calc((1 * var(--border-radius)) + 8px)',
      }}>
      <div
        style={{
          minWidth: `${70 + intervalRoutes.size * 50}px`,
          flex: 1,
        }}>
        <div className={styles.timetableRoutes}>
          <InlineSVG key="clock_svg" className={styles.icon} src={clockIcon} />
          {departureIntervalsByRoute.routeIds.map(routeId => {
            return (
              <div
                key={`route-${routeId}`}
                className={styles.routeHeadings}
                style={{
                  color: getColor({
                    ...getRoute(routeId),
                    padding: '0.2em 0 0.2em calc(0.45em + var(--border-radius))',
                  }),
                }}>
                <InlineSVG className={styles.icon} src={getIcon({ ...getRoute(routeId) })} />
                {routeId}
              </div>
            );
          })}
        </div>
        <div className={styles.firstAndLastDepartures}>
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
            try {
              return (
                <Row
                  className={styles.timetableMinutes}
                  style={{
                    padding: '0.2em 0 0.2em calc(0.45em + var(--border-radius))',
                  }}>
                  <div className={styles.hours}>{hours}</div>
                  {departureIntervalsByRoute.routeIds.map(routeId => (
                    <WrappingRow style={{ justifyContent: 'center' }}>
                      <div className={styles.interval}>
                        {intervals[routeId] ? `${intervals[routeId]} min` : '-'}
                      </div>
                    </WrappingRow>
                  ))}
                </Row>
              );
            } catch (err) {
              console.log(JSON.stringify(departureIntervalsByRoute));
              console.log('KEY:', hours);
              return <>errr</>;
            }
          })}
        </div>
        <div className={styles.firstAndLastDepartures}>
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
      </div>

      <div style={{ flex: 1 }}>
        <div
          className={styles.timetableRoutes}
          style={{
            display: 'flex',
            gap: '32px',
            marginLeft: 'calc(-1 * var(--border-radius))',
          }}>
          <InlineSVG key="clock_svg" className={styles.icon} src={clockIcon} />
          <div className={styles.routeHeadings} style={{ color: getColor({ mode: 'BUS' }) }}>
            <InlineSVG className={styles.icon} src={getIcon({ mode: 'BUS' })} />
            <> {Array.from(normalBusRoutes).join(', ')} </>
          </div>
        </div>
        <TableRows noPadLeft={busDepartures.length > 0} departures={busDepartures} />
      </div>
    </div>
  ) : (
    <>
      <div
        className={styles.timetableRoutes}
        style={{ paddingRight: 'calc(0.45em + var(--border-radius))' }}>
        <InlineSVG key="clock_svg" className={styles.icon} src={clockIcon} />
        {departureIntervalsByRoute.routeIds.map(routeId => {
          return (
            <div
              key={`route-${routeId}`}
              className={styles.routeHeadings}
              style={{ color: getColor({ ...getRoute(routeId) }) }}>
              <InlineSVG className={styles.icon} src={getIcon({ ...getRoute(routeId) })} />
              {routeId}
            </div>
          );
        })}
      </div>
      <div
        className={styles.firstAndLastDepartures}
        style={{ paddingRight: 'calc(0.45em + var(--border-radius))' }}>
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
          try {
            return (
              <Row className={styles.timetableMinutes}>
                <div className={styles.hours}>{hours}</div>
                {departureIntervalsByRoute.routeIds.map(routeId => (
                  <WrappingRow>
                    <div className={styles.interval}>
                      {intervals[routeId] ? `${intervals[routeId]} min` : '-'}
                    </div>
                  </WrappingRow>
                ))}
              </Row>
            );
          } catch (err) {
            console.log(JSON.stringify(departureIntervalsByRoute));
            console.log('KEY:', hours);
            return <>errr</>;
          }
        })}
      </div>
      <div
        className={styles.firstAndLastDepartures}
        style={{ paddingRight: 'calc(0.45em + var(--border-radius))' }}>
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
