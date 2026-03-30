import React from 'react';
import PropTypes from 'prop-types';

import styles from './lineTimetableHeader.css';
import { PrintButton } from '../util';

const LineTimetableHeader = props => {
  const { routeIdParsed, nameFi, nameSe } = props;
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
    </div>
  );
};

LineTimetableHeader.defaultProps = {
  nameFi: '',
  nameSe: '',
};

LineTimetableHeader.propTypes = {
  routeIdParsed: PropTypes.string.isRequired,
  nameFi: PropTypes.string,
  nameSe: PropTypes.string,
};

export default LineTimetableHeader;
