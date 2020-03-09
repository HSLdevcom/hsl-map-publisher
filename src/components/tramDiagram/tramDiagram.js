import React from 'react';
import PropTypes from 'prop-types';

import { InlineSVG } from 'components/util';

import styles from './tramDiagram.css';

const TramDiagram = props => (
  <div className={styles.root}>
    <InlineSVG className={styles.diagram} src={props.svg} />
  </div>
);

TramDiagram.propTypes = {
  svg: PropTypes.any.isRequired,
};

export default TramDiagram;
