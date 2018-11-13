import React from 'react';

import { InlineSVG } from 'components/util';
import tramDiagramIcon from 'icons/tram_diagram_late_2018.svg';

import styles from './tramDiagram.css';

const TramDiagram = () => (
  <div className={styles.root}>
    <div className={styles.componentName}>
      <div className={styles.title}>Linjojen reitit</div>
      <div className={styles.subtitle}>Linjernas rutter</div>
    </div>
    <InlineSVG className={styles.diagram} src={tramDiagramIcon} />
  </div>
);

export default TramDiagram;
