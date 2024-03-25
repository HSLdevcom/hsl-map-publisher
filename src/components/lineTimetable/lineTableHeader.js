import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './lineTableHeader.css';

const LineTableHeader = props => {
  const { stop } = props;
  return (
    <div className={styles.stop}>
      <p className={styles.stopName}>{stop.nameFi}</p>
      <p className={styles.stopName}>{stop.nameSe}</p>
    </div>
  );
};

LineTableHeader.propTypes = {
  stop: PropTypes.object.isRequired,
};

export default LineTableHeader;
