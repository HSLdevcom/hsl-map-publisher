import React from 'react';
import PropTypes from 'prop-types';

import styles from './lineTableHeader.css';

const LineTableHeader = props => {
  const { stop } = props;
  return (
    <div className={styles.stop}>
      <p className={styles.stopNamePrimary}>{stop.nameFi}</p>
      <p className={styles.stopNameSecondary}>{stop.nameSe}</p>
    </div>
  );
};

LineTableHeader.propTypes = {
  stop: PropTypes.object.isRequired,
};

export default LineTableHeader;
