import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './lineTimetable.css';
import LineTimetableHeader from './lineTimetableHeader';
import LineTableColumns from './lineTableColumns';
import AllStopsList from './allStopsList';

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
      <LineTableColumns departures={departuresByStop} days={SCHEDULE_SEGMENT.weekdays} />

      <div className={styles.pageBreak}>&nbsp;</div>
      <LineTimetableHeader lineIdParsed={lineIdParsed} nameFi={nameFi} nameSe={nameSe} />
      <span className={styles.timetableDays}>Lauantai/Lördag</span>
      <LineTableColumns departures={departuresByStop} days={SCHEDULE_SEGMENT.saturdays} />
      <div className={styles.pageBreak}>&nbsp;</div>
      <LineTimetableHeader lineIdParsed={lineIdParsed} nameFi={nameFi} nameSe={nameSe} />
      <span className={styles.timetableDays}>Sunnuntai/Söndag</span>
      <LineTableColumns departures={departuresByStop} days={SCHEDULE_SEGMENT.sundays} />
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
};

function LineTimetable(props) {
  return (
    <div>
      {props.departures.map(routeWithDepartures => {
        const { nameFi, nameSe, departuresByStop, dateBegin, dateEnd, line } = routeWithDepartures;
        const { lineIdParsed } = line.nodes[0];
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
