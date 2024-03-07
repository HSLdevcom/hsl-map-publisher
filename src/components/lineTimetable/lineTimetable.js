import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './lineTimetable.css';
import LineTimetableHeader from './lineTimetableHeader';
import LineTableHeader from './lineTableHeader';

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

const getNotes = (notes, symbols) => {
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
      isMultiLineTimetable: false,
    };
    console.log(props.departures);
  }

  render() {
    const { lineIdParsed, nameFi, nameSe } = this.props.line;
    const routeSegments = this.props.line.routes.nodes[0].routeSegments.nodes;

    return (
      <div>
        <LineTimetableHeader lineIdParsed={lineIdParsed} nameFi={nameFi} nameSe={nameSe} />
        <h1>{this.state.isMultiLineTimetable}</h1>
        <LineTableHeader stops={routeSegments} />
      </div>
    );
  }
}

LineTimetable.defaultProps = {
  routes: {},
  dateBegin: null,
  dateEnd: null,
  departures: {},
};

LineTimetable.propTypes = {
  routes: PropTypes.object,
  line: PropTypes.object.isRequired,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  departures: PropTypes.object,
};

export default LineTimetable;
