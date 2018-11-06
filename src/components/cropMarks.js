import React from 'react';
import PropTypes from 'prop-types';

import styles from './cropMarks.css';

const CropMarks = props => <div className={styles.root}>{props.children}</div>;

CropMarks.propTypes = {
  children: PropTypes.node.isRequired, // ItemWrapper components
};

export default CropMarks;
