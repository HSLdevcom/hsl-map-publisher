import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './lineTimetable.css';
import LineTimetableHeader from './lineTimetableHeader';
import LineTableColumns from './lineTableColumns';
import AllStopsList from './allStopsList';
import { filter, groupBy, flatten } from 'lodash';

const SCHEDULE_SEGMENT = {
  weekdays: 'mondays-fridays',
  saturdays: 'saturdays',
  sundays: 'sundays',
};

const formatDate = date => {
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return `${day}.${monthIndex}.${year}`;
};

const hasTimedStopRoutes = departuresByRoute => {
  return filter(departuresByRoute, route => route.departuresByStop.length > 1).length > 0;
};

const RouteDepartures = props => {
  const {
    showPrintBtn,
    lang,
    departuresByStop,
    lineIdParsed,
    nameFi,
    nameSe,
    dateBegin,
    dateEnd,
    showTimedStops,
  } = props;
  return (
    <div>
      <LineTimetableHeader
        lineIdParsed={lineIdParsed}
        nameFi={nameFi}
        nameSe={nameSe}
        showPrintBtn={showPrintBtn}
        lang={lang}
      />
      <span className={styles.timetableDays}>Maanantai-Perjantai</span>
      <span className={styles.timetableDays}>Måndag-Fredag</span>
      <span className={styles.timetableDates}>
        {formatDate(new Date(dateBegin))}-{formatDate(new Date(dateEnd))}
      </span>
      <LineTableColumns
        showDivider={!showTimedStops}
        departures={departuresByStop}
        days={SCHEDULE_SEGMENT.weekdays}
      />

      <div className={styles.pageBreak}>&nbsp;</div>
      <LineTimetableHeader lineIdParsed={lineIdParsed} nameFi={nameFi} nameSe={nameSe} />
      <span className={styles.timetableDays}>Lauantai/Lördag</span>
      <span className={styles.timetableDates}>
        {formatDate(new Date(dateBegin))}-{formatDate(new Date(dateEnd))}
      </span>
      <LineTableColumns
        showDivider={!showTimedStops}
        departures={departuresByStop}
        days={SCHEDULE_SEGMENT.saturdays}
      />
      <div className={styles.pageBreak}>&nbsp;</div>
      <LineTimetableHeader lineIdParsed={lineIdParsed} nameFi={nameFi} nameSe={nameSe} />
      <span className={styles.timetableDays}>Sunnuntai/Söndag</span>
      <span className={styles.timetableDates}>
        {formatDate(new Date(dateBegin))}-{formatDate(new Date(dateEnd))}
      </span>
      <LineTableColumns
        showDivider={!showTimedStops}
        departures={departuresByStop}
        days={SCHEDULE_SEGMENT.sundays}
      />
      <div className={styles.pageBreak}>&nbsp;</div>
    </div>
  );
};

RouteDepartures.defaultProps = {
  lineIdParsed: '',
  nameFi: '',
  nameSe: '',
  showPrintBtn: '',
  lang: '',
  departuresByStop: {},
  dateBegin: '',
  dateEnd: '',
  showTimedStops: true,
};

RouteDepartures.propTypes = {
  lineIdParsed: PropTypes.string,
  nameFi: PropTypes.string,
  nameSe: PropTypes.string,
  showPrintBtn: PropTypes.string,
  lang: PropTypes.string,
  departuresByStop: PropTypes.object,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  showTimedStops: PropTypes.bool,
};

function LineTimetable(props) {
  const { departures } = props;
  const showTimedStops = hasTimedStopRoutes(departures);

  if (showTimedStops) {
    return (
      <div>
        {departures.map(routeWithDepartures => {
          const { nameFi, nameSe, departuresByStop, dateBegin, dateEnd } = routeWithDepartures;
          const { lineIdParsed } = props.line;
          return (
            <div>
              <RouteDepartures
                lineIdParsed={lineIdParsed}
                nameFi={nameFi}
                nameSe={nameSe}
                showPrintBtn={props.showPrintBtn}
                lang={props.lang}
                departuresByStop={departuresByStop}
                dateBegin={dateBegin}
                dateEnd={dateEnd}
                showTimedStops={showTimedStops}
              />
              <AllStopsList stops={routeWithDepartures.routeSegments.nodes} lineId={lineIdParsed} />
            </div>
          );
        })}
      </div>
    );
  }

  const groupedDepartures = groupBy(departures, 'routeId'); // Group by route ID
  const combinedDeparturesForBothDirections = Object.values(groupedDepartures).map(route => {
    const bothStopDepartures = route.map(direction => {
      return direction.departuresByStop;
    });
    // Combine both starting stops into the same route so they show up side by side in RouteDepartures
    return { ...route[0], departuresByStop: flatten(bothStopDepartures) };
  });

  return (
    <div>
      {combinedDeparturesForBothDirections.map(routeWithDepartures => {
        const { nameFi, nameSe, departuresByStop, dateBegin, dateEnd } = routeWithDepartures;
        const { lineIdParsed } = props.line;
        return (
          <div>
            <RouteDepartures
              lineIdParsed={lineIdParsed}
              nameFi={nameFi}
              nameSe={nameSe}
              showPrintBtn={props.showPrintBtn}
              lang={props.lang}
              departuresByStop={departuresByStop}
              dateBegin={dateBegin}
              dateEnd={dateEnd}
              showTimedStops={showTimedStops}
            />
            <AllStopsList stops={routeWithDepartures.routeSegments.nodes} lineId={lineIdParsed} />
          </div>
        );
      })}
    </div>
  );
}

LineTimetable.defaultProps = {
  dateBegin: null,
  dateEnd: null,
  departures: {},
  showPrintBtn: false,
  lang: 'fi',
};

LineTimetable.propTypes = {
  line: PropTypes.object.isRequired,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  departures: PropTypes.object,
  showPrintBtn: PropTypes.bool,
  lang: PropTypes.string,
};

export default LineTimetable;
