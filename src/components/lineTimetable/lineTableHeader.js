import React from 'react';
import PropTypes from 'prop-types';

import styles from './lineTableHeader.css';

const LineTableHeader = props => {
  const { stop, isLastStop } = props;
  return (
    <div className={styles.headerContainer}>
      <div className={styles.stop}>
        <p className={styles.stopNamePrimary}>{stop.nameFi}</p>
        <p className={styles.stopNameSecondary}>{stop.nameSe}</p>
      </div>
      {!isLastStop && <div className={styles.directionBracket}>&gt;</div>}
    </div>
  );
};

LineTableHeader.propTypes = {
  stop: PropTypes.object.isRequired,
  isLastStop: PropTypes.bool.isRequired,
};

export default LineTableHeader;
