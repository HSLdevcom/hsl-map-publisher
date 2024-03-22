import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './lineTimetableHeader.css';

const LineTimetableHeader = props => {
  return (
    <div className={styles.header}>
      <div className={styles.lineId}>
        <span className={styles.strong}>{props.lineIdParsed}</span>
      </div>
      <div className={styles.nameContainer}>
        <div className={styles.lineName}>
          <span>{props.nameFi}</span>
        </div>
        <div className={styles.lineNameSecondary}>
          <span>{props.nameSe}</span>
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
  lineIdParsed: PropTypes.string.isRequired,
  nameFi: PropTypes.string,
  nameSe: PropTypes.string,
};

export default LineTimetableHeader;
