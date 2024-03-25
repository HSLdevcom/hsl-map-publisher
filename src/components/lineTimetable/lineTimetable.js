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

  return `${day}.${monthIndex}.${year}`;
};

const PrintButton = lang => {
  const PRINT_TEXT = {
    fi: 'TULOSTA AIKATAULU',
    sv: 'SKRIV UT TIDTABEL',
    en: 'PRINT SCHEDULE',
  };

  return (
    <div className={styles.noPrint}>
      <button className={styles.printBtn} type="button" onClick={window.print}>
        {PRINT_TEXT[lang.lang]}
      </button>
    </div>
  );
};

class LineTimetable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMultiLineTimetable: false, // Placeholder for implementation of "multiple lines" version
    };
  }

  render() {
    const { lineIdParsed, nameFi, nameSe } = this.props.line;
    const { allStops } = this.props;

    return (
      <div>
        <LineTimetableHeader lineIdParsed={lineIdParsed} nameFi={nameFi} nameSe={nameSe} />
        <h1>{this.state.isMultiLineTimetable}</h1>
        <span className={styles.timetableDays}>Maanantai-Perjantai</span>
        <span className={styles.timetableDays}>Måndag-Fredag</span>
        <span className={styles.timetableDates}>
          {formatDate(new Date(this.props.dateBegin))}-{formatDate(new Date(this.props.dateEnd))}
        </span>
        <LineTableColumns
          departures={this.props.departures}
          stopSequence={this.props.timedStops}
          days={SCHEDULE_SEGMENT.weekdays}
        />

        <div className={styles.pageBreak}>&nbsp;</div>
        <LineTimetableHeader lineIdParsed={lineIdParsed} nameFi={nameFi} nameSe={nameSe} />
        <span className={styles.timetableDays}>Lauantai/Lördag</span>
        <LineTableColumns
          departures={this.props.departures}
          stopSequence={this.props.timedStops}
          days={SCHEDULE_SEGMENT.saturdays}
        />
        <div className={styles.pageBreak}>&nbsp;</div>
        <LineTimetableHeader lineIdParsed={lineIdParsed} nameFi={nameFi} nameSe={nameSe} />
        <span className={styles.timetableDays}>Sunnuntai/Söndag</span>
        <LineTableColumns
          departures={this.props.departures}
          stopSequence={this.props.timedStops}
          days={SCHEDULE_SEGMENT.sundays}
        />
        <div className={styles.pageBreak}>&nbsp;</div>
        <AllStopsList stops={allStops} lineId={lineIdParsed} />
      </div>
    );
  }
}

LineTimetable.defaultProps = {
  dateBegin: null,
  dateEnd: null,
  departures: {},
  timedStops: {},
  allStops: [],
};

LineTimetable.propTypes = {
  line: PropTypes.object.isRequired,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  departures: PropTypes.object,
  timedStops: PropTypes.object,
  allStops: PropTypes.array,
};

export default LineTimetable;
