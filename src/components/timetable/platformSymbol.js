import React from 'react';
import PropTypes from 'prop-types';

import styles from './platformSymbol.css';

const SIZE = 40;

const platformSymbol = ({ platform }) => (
  <svg className={styles.container} width={SIZE} height={SIZE}>
    <circle className={styles.circle} cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} />
    <text className={styles.text} x={SIZE / 2} y={SIZE / 2} fontSize={SIZE / 2}>
      {platform}
    </text>
  </svg>
);

platformSymbol.propTypes = {
  platform: PropTypes.string.isRequired,
};

export default platformSymbol;
