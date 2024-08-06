import React from 'react';
import PropTypes from 'prop-types';

import styles from './lineTimetableHeader.css';
import { PrintButton } from '../util';

const LineTimetableHeader = props => {
  const { showPrintBtn, lang, routeIdParsed, nameFi, nameSe } = props;
  return (
    <div className={styles.header}>
      <div className={styles.lineId}>
        <span className={styles.strong}>{routeIdParsed}</span>
      </div>
      <div className={styles.nameContainer}>
        <div className={styles.lineName}>
          <span>{nameFi}</span>
        </div>
        <div className={styles.lineNameSecondary}>
          <span>{nameSe}</span>
        </div>
      </div>
      <div className={styles.printBtnContainer}>{showPrintBtn && <PrintButton lang={lang} />}</div>
    </div>
  );
};

LineTimetableHeader.defaultProps = {
  nameFi: '',
  nameSe: '',
  showPrintBtn: false,
  lang: 'fi',
};

LineTimetableHeader.propTypes = {
  routeIdParsed: PropTypes.string.isRequired,
  nameFi: PropTypes.string,
  nameSe: PropTypes.string,
  showPrintBtn: PropTypes.bool,
  lang: PropTypes.string,
};

export default LineTimetableHeader;
