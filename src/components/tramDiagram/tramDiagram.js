import React from 'react';
import PropTypes from 'prop-types';

import { InlineSVG } from 'components/util';
import tramDiagramIcon from 'icons/tram_diagram.svg';

import styles from './tramDiagram.css';

const TramDiagram = props => {
  let svg;
  if (props.src && props.src.slots[0].image) {
    const [slot] = props.src.slots;
    ({ svg } = slot.image);
  }
  return (
    <div className={styles.root}>
      <InlineSVG className={styles.diagram} src={svg || tramDiagramIcon} />
    </div>
  );
};

TramDiagram.propTypes = {
  src: PropTypes.any,
};

TramDiagram.defaultProps = {
  src: null,
};

export default TramDiagram;
