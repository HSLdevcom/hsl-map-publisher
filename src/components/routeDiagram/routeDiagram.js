import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import { InlineSVG } from 'components/util';
import markerIcon from 'icons/marker.svg';

import Path from './path';
import styles from './routeDiagram.css';

const RouteDiagram = props => (
  <div
    className={
      !props.printAsA3
        ? styles.root
        : classNames(styles.root, styles.a3, props.useWide ? styles.useWide : '')
    }>
    <div className={styles.componentName}>
      <div className={!props.printAsA3 ? styles.title : styles.titleA3}>Linjojen reitit</div>
      <div className={!props.printAsA3 ? styles.subtitle : styles.subtitleA3}>
        Linjernas rutter / Routes
      </div>
    </div>
    <div className={styles.start}>
      <InlineSVG src={markerIcon} className={styles.icon} />
      <div className={styles.title}>
        Olet tässä&nbsp;&nbsp;
        <span className={styles.subtitle}>Du är här&nbsp;&nbsp;</span>
        <span className={styles.subtitle}>You are here</span>
      </div>
    </div>
    <Path {...props.tree} />
  </div>
);

RouteDiagram.defaultProps = {
  printAsA3: false,
  useWide: false,
};

RouteDiagram.propTypes = {
  tree: PropTypes.shape(Path.propTypes).isRequired,
  printAsA3: PropTypes.bool,
  useWide: PropTypes.bool,
};

export default RouteDiagram;
