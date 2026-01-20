import React, { Component } from 'react';
import CoverPage from '../coverPage/coverPage';
import PropTypes from 'prop-types';
import {
  Spacer,
  PlatformSymbol,
  getWeekdayName,
  PrintButton,
  Row,
  WrappingRow,
} from 'components/util';
import classNames from 'classnames';
import clockIcon from 'icons/clock.svg';
import InlineSVG from 'components/inlineSVG';

import { prepareOrderedDepartureHoursByRoute } from './departureUtils';
import TableHeader from './tableHeader';
import TableRows from './tableRows';
import SimpleRoutes from './simpleRoutes';
import { getIcon, getColor, trimRouteId } from 'util/domain';
import partition from 'lodash/partition';

import styles from './timetable.css';

const A4_PAGE_HEIGHT = 1110;
const TEXT_HEIGHT = 12;

const formatDate = date => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return `${day} ${monthNames[monthIndex]} ${year}`;
};

const getZoneLetterStyle = zone => ({
  transform:
    zone === 'B'
      ? 'translate(calc(-50%), calc(-50% + 2px))'
      : zone === 'C'
      ? 'translate(calc(-50% - 2px), calc(-50% + 2px))'
      : zone === 'D'
      ? 'translate(calc(-50% + 2px), calc(-50% + 2px))'
      : 'translate(-50%, -50%)', // No px adjustments for zone A and the "else" case.
});

export const getNotes = (notes, symbols) => {
  const parsedNotes = [];
  symbols.forEach(symbol => {
    notes.forEach(note => {
      if (note.substring(0, symbol.length) === symbol && !parsedNotes.includes(note)) {
        parsedNotes.push(note);
      }
    });
  });
  return parsedNotes;
};

class Timetable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      renderAddressInfo: false,
    };
  }

  componentDidMount() {
    const { renderAddressInfo } = this.state;
    if (!renderAddressInfo && this.props.printableAsA4 && this.props.showAddressInfo) {
      this.setState({ renderAddressInfo: true });
    }
  }

  /**
   * @param {string} id
   * @returns {{mode: string, trunkRoute: boolean}}
   */
  getRoute(id) {
    return this.props.routeIdToModeMap[id];
  }

  render() {
    const { combinedDays, routeIdToModeMap, intervalTimetable } = this.props;
    const date = new Date(`${this.props.date}T00:00:00`);
    if (!this.props.hasDepartures) {
      return null;
    }
    const opts = { year: 'numeric', month: 'numeric', day: 'numeric' };
    const today = new Date().toLocaleDateString('fi', opts);
    const address = this.props.addressFi ? ` ${this.props.addressFi},` : '';
    const addressInfo = `${this.props.stopNameFi} (${this.props.stopShortId.replace(
      /\s+/g,
      '',
    )}),${address} ${today}`;

    const addressInfoPositions = [];
    if (this.state.renderAddressInfo) {
      const { scrollHeight } = this.content;
      const pages = Math.ceil(scrollHeight / A4_PAGE_HEIGHT);
      let j = 0;
      for (let i = 1; i < pages + 1; i++) {
        addressInfoPositions.push(i * A4_PAGE_HEIGHT + j * TEXT_HEIGHT);
        j++;
      }
    }

    return (
      <div
        className={classNames(styles.root, {
          [styles.summer]: this.props.isSummerTimetable,
          [styles.printable]: this.props.printableAsA4,
          [styles.standalone]: this.props.standalone,
          [styles.greyscale]: this.props.greyscale,
        })}
        ref={ref => {
          this.content = ref;
        }}>
        {this.props.showCoverPage && (
          <CoverPage
            stopShortId={this.props.stopShortId.replace(/\s+/g, '')}
            stopName={this.props.stopNameFi}
            dateBegin={this.props.dateBegin}
            dateEnd={this.props.dateEnd}
            greyscale={this.props.greyscale}
          />
        )}
        {addressInfoPositions.map(height => (
          <span className={styles.address} style={{ top: `${height}px` }}>
            {addressInfo}
          </span>
        ))}
        <div className={styles.header}>
          {this.props.showStopInformation && (
            <div style={{ display: 'flex' }}>
              <div className={styles.headerTitle}>
                <div className={styles.title}>
                  {this.props.stopNameFi}
                  &nbsp;&nbsp;
                </div>
                <div className={styles.subtitle}>{this.props.stopNameSe}</div>
              </div>
              <div>
                {this.props.platformInfo && this.props.platform && (
                  <PlatformSymbol platform={this.props.platform} />
                )}
              </div>
              {this.props.showPrintButton ? <PrintButton lang={this.props.lang} /> : ''}
            </div>
          )}
          {this.props.showValidityPeriod && !intervalTimetable && (
            <div
              className={classNames(styles.validity, {
                [styles.coverPageMargin]: this.props.showCoverPage,
              })}>
              <div className={styles.shortId}>
                {this.props.stopShortId && `${this.props.stopShortId.replace(/\s+/g, '')}`}
              </div>
              <div className={styles.title}>Aikataulut voimassa</div>
              <div>Tidtabeller giltiga/Timetables valid</div>
              <div>
                {new Date(this.props.dateBegin).toLocaleDateString('fi')}
                &nbsp;-&nbsp;
                {new Date(this.props.dateEnd).toLocaleDateString('fi')}
              </div>
              <div>
                {formatDate(new Date(this.props.dateBegin))}
                &nbsp;-&nbsp;
                {formatDate(new Date(this.props.dateEnd))}
              </div>
            </div>
          )}
        </div>
        {this.props.showComponentName && !intervalTimetable && (
          <div className={styles.componentName}>
            <div className={styles.title}>Pysäkkiaikataulu&nbsp;&nbsp;</div>
            <div className={styles.subtitle}>Hållplatstidtabell</div>
            <div className={styles.subtitle}>Stop timetable</div>
          </div>
        )}
        <div className={styles.validFrom}>
          Aikataulu alkaen {formatDate(date)} - / Tidtabeller fran {formatDate(date)} - /Timetables
          from {formatDate(date)} -
        </div>

        {this.props.standalone && (
          <React.Fragment>
            <div className={styles.stopZone}>
              <div className={styles.zoneTitle}>Vyöhyke</div>
              <div className={styles.zoneSubtitle}>Zon/Zone</div>
              <div className={styles.zone}>
                <span className={styles.zoneLetter} style={getZoneLetterStyle(this.props.stopZone)}>
                  {this.props.stopZone}
                </span>
              </div>
            </div>
            <SimpleRoutes stopId={this.props.stopId} date={this.props.date} />
          </React.Fragment>
        )}
        {Object.keys(this.props.combinedDays).map(combinedDay => {
          const dayNames = combinedDay.split('-');
          const fiTitle =
            dayNames.length > 1
              ? `${getWeekdayName(dayNames[0], 'fi')} - ${getWeekdayName(dayNames[1], 'fi')}`
              : `${getWeekdayName(dayNames[0], 'fi')}`;
          const svTitle =
            dayNames.length > 1
              ? `${getWeekdayName(dayNames[0], 'sv')} - ${getWeekdayName(dayNames[1], 'sv')}`
              : `${getWeekdayName(dayNames[0], 'sv')}`;
          const enTitle =
            dayNames.length > 1
              ? `${getWeekdayName(dayNames[0], 'en')} - ${getWeekdayName(dayNames[1], 'en')}`
              : `${getWeekdayName(dayNames[0], 'en')}`;

          const intervalRoutes = new Set();
          const normalBusRoutes = new Set();

          for (const key in routeIdToModeMap) {
            const routeDescription = this.getRoute(key);
            if (routeDescription.mode === 'BUS' && !routeDescription.trunkRoute) {
              normalBusRoutes.add(key);
            } else {
              intervalRoutes.add(key);
            }
          }

          const [nonBusDepartures, busDepartures] = partition(
            combinedDays[combinedDay],
            it => intervalRoutes.has(trimRouteId(it.routeId).replace(/[^0-9]/g, '')),
            // .replace(/[^0-9]/g, '')),
          );
          console.log('normalBusRoutes', normalBusRoutes);
          console.log('intervalRoutes', intervalRoutes);
          // console.log(routeIdToModeMap);
          // console.log('departureCount', combinedDays[combinedDay].length);
          console.log('nonBusDepartures', nonBusDepartures);
          console.log('busDepartures', busDepartures);
          const departureIntervalsByRoute = prepareOrderedDepartureHoursByRoute(nonBusDepartures);

          return (
            <div key={`tableheader_container_${fiTitle}`}>
              <TableHeader
                title={fiTitle}
                subtitleSw={svTitle}
                subtitleEn={enTitle}
                printingAsA4={this.props.printableAsA4}
                useCompactLayout={this.props.useCompactLayout}
                intervalTimetable={intervalTimetable}
              />
              {intervalTimetable ? (
                busDepartures.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 'calc((1 * var(--border-radius)) + 8px)',
                    }}>
                    <div
                      style={{
                        minWidth: `${70 + departureIntervalsByRoute.routeIds.length * 50}px`,
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
                                  ...this.getRoute(routeId),
                                  padding: '0.2em 0 0.2em calc(0.45em + var(--border-radius))',
                                }),
                              }}>
                              <InlineSVG
                                className={styles.icon}
                                src={getIcon({ ...this.getRoute(routeId) })}
                              />
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
                        <div
                          className={styles.routeHeadings}
                          style={{ color: getColor({ mode: 'BUS' }) }}>
                          <InlineSVG className={styles.icon} src={getIcon({ mode: 'BUS' })} />
                          <> {Array.from(normalBusRoutes).join(', ')} </>
                        </div>
                      </div>
                      <TableRows
                        noPadLeft={intervalTimetable && busDepartures.length > 0}
                        departures={busDepartures}
                      />
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
                            style={{ color: getColor({ ...this.getRoute(routeId) }) }}>
                            <InlineSVG
                              className={styles.icon}
                              src={getIcon({ ...this.getRoute(routeId) })}
                            />
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
                )
              ) : (
                <TableRows
                  noPadLeft={intervalTimetable && busDepartures.length > 0}
                  departures={this.props.combinedDays[combinedDay]}
                />
              )}
            </div>
          );
        })}
        {this.props.showNotes && this.props.notes.length !== 0 && <Spacer height={20} />}
        {this.props.showNotes &&
          getNotes(this.props.notes, this.props.specialSymbols).map(note => (
            <div key={note} className={styles.footnote}>
              {note}
            </div>
          ))}
      </div>
    );
  }
}

Timetable.defaultProps = {
  intervalTimetable: false,
  saturdays: null,
  sundays: null,
  isSummerTimetable: false,
  showValidityPeriod: true,
  showNotes: true,
  showComponentName: true,
  printableAsA4: false,
  standalone: false,
  greyscale: false,
  platformInfo: false,
  specialSymbols: [],
  platform: null,
  addressFi: null,
  showAddressInfo: true,
  showPrintButton: false,
  lang: 'fi',
  showCoverPage: false,
  useCompactLayout: false,
  routeIdToModeMap: {},
};

Timetable.propTypes = {
  intervalTimetable: PropTypes.bool,
  saturdays: PropTypes.arrayOf(PropTypes.shape(TableRows.propTypes.departures)),
  sundays: PropTypes.arrayOf(PropTypes.shape(TableRows.propTypes.departures)),
  notes: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  isSummerTimetable: PropTypes.bool,
  showValidityPeriod: PropTypes.bool,
  showNotes: PropTypes.bool,
  dateBegin: PropTypes.string.isRequired,
  dateEnd: PropTypes.string.isRequired,
  showComponentName: PropTypes.bool,
  showStopInformation: PropTypes.bool.isRequired,
  printableAsA4: PropTypes.bool,
  stopShortId: PropTypes.string.isRequired,
  stopId: PropTypes.string.isRequired,
  addressFi: PropTypes.string,
  stopZone: PropTypes.string.isRequired,
  platform: PropTypes.string,
  date: PropTypes.string.isRequired,
  stopNameFi: PropTypes.string.isRequired,
  stopNameSe: PropTypes.string.isRequired,
  standalone: PropTypes.bool,
  greyscale: PropTypes.bool,
  platformInfo: PropTypes.bool,
  specialSymbols: PropTypes.array,
  hasDepartures: PropTypes.bool.isRequired,
  showAddressInfo: PropTypes.bool,
  showPrintButton: PropTypes.bool,
  combinedDays: PropTypes.object.isRequired,
  lang: PropTypes.string,
  showCoverPage: PropTypes.bool,
  useCompactLayout: PropTypes.bool,
  routeIdToModeMap: PropTypes.object,
};

export default Timetable;
