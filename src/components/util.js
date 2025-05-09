import React from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash/omit';

import styles from './util.css';

const Row = props => (
  <div className={[styles.row, props.className].join(' ')} style={props.style}>
    {props.children}
  </div>
);

Row.defaultProps = {
  style: {},
  className: '',
};

Row.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const JustifiedRow = props => (
  <div className={styles.justifiedRow} style={props.style}>
    {props.children}
  </div>
);

JustifiedRow.defaultProps = {
  style: {},
};

JustifiedRow.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const WrappingRow = props => (
  <div className={styles.wrappingRow} style={props.style}>
    {props.children}
  </div>
);

WrappingRow.defaultProps = {
  style: {},
};

WrappingRow.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const Column = props => (
  <div className={[styles.column, props.className].join(' ')} style={props.style}>
    {props.children}
  </div>
);

Column.defaultProps = {
  style: {},
  className: '',
};

Column.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const CenteringColumn = props => (
  <div className={styles.centeringColumn} style={props.style}>
    {props.children}
  </div>
);

CenteringColumn.defaultProps = {
  style: {},
};

CenteringColumn.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const JustifiedColumn = props => (
  <div className={styles.justifiedColumn} style={props.style}>
    {props.children}
  </div>
);

JustifiedColumn.defaultProps = {
  style: {},
};

JustifiedColumn.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const Spacer = props => (
  <div style={{ flex: '0 0 auto', width: props.width, height: props.height }} />
);

Spacer.defaultProps = {
  width: 0,
  height: 0,
};

Spacer.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

const FlexSpacer = () => <div style={{ flex: '2' }} />;

const InlineSVG = props => (
  <div
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{ __html: props.src }}
    {...omit(props, 'src')}
  />
);

InlineSVG.propTypes = {
  src: PropTypes.string.isRequired,
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

PrintButton.propTypes = {
  lang: PropTypes.string.isRequired,
};

const PlatformSymbol = ({ platform, size, color }) => (
  <svg className={styles.PScontainer} width={size} height={size}>
    <circle
      className={styles.PScircle}
      style={{ stroke: color }}
      cx={size / 2}
      cy={size / 2}
      r={size / 2 - 2}
    />
    <text
      className={styles.PStext}
      style={{ fill: color }}
      x={size / 2}
      y={size / 2}
      fontSize={size / 2}>
      {platform}
    </text>
  </svg>
);

const translations = {
  fi: {
    mondays: 'Maanantai',
    tuesdays: 'Tiistai',
    wednesdays: 'Keskiviikko',
    thursdays: 'Torstai',
    fridays: 'Perjantai',
    saturdays: 'Lauantai',
    sundays: 'Sunnuntai',
  },
  sv: {
    mondays: 'Måndag',
    tuesdays: 'Tisdag',
    wednesdays: 'Onsdag',
    thursdays: 'Torsdag',
    fridays: 'Fredag',
    saturdays: 'Lördag',
    sundays: 'Söndag',
  },
  en: {
    mondays: 'Monday',
    tuesdays: 'Tuesday',
    wednesdays: 'Wednesday',
    thursdays: 'Thursday',
    fridays: 'Friday',
    saturdays: 'Saturday',
    sundays: 'Sunday',
  },
};

const getWeekdayName = (dayName, lang = 'en') => {
  let selectedLanguage = lang;
  if (!translations[selectedLanguage]) {
    console.warn(`Language ${lang} not supported. Falling back to English.`);
    selectedLanguage = 'en';
  }
  if (!translations[selectedLanguage][dayName]) {
    console.warn(`Day name ${dayName} not supported.`);
    return null;
  }
  return translations[selectedLanguage][dayName];
};

PlatformSymbol.propTypes = {
  platform: PropTypes.string.isRequired,
  size: PropTypes.number,
  color: PropTypes.string,
};

PlatformSymbol.defaultProps = {
  size: 40,
  color: undefined, // The default is the bus color (comes from css)
};

export {
  Row,
  JustifiedRow,
  WrappingRow,
  Column,
  CenteringColumn,
  JustifiedColumn,
  Spacer,
  FlexSpacer,
  InlineSVG,
  PlatformSymbol,
  getWeekdayName,
  PrintButton,
};
