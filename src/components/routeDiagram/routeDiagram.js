import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

import InlineSVG from 'components/inlineSVG';
import markerIcon from 'icons/marker.svg';

import Path from './path';
import styles from './routeDiagram.css';

const RouteDiagram = props => {
  const { printAsA3, useWide, useCompactLayout, tree } = props;
  tree.useCompactLayout = useCompactLayout;
  return (
    <div
      className={
        !printAsA3
          ? styles.root
          : classNames(styles.root, styles.a3, {
              [styles.useWide]: useWide,
            })
      }>
      <div className={classNames(styles.componentName, { [styles.componentNameA3]: printAsA3 })}>
        <div className={!printAsA3 ? styles.title : styles.titleA3}>Linjojen reitit</div>
        <div className={!printAsA3 ? styles.subtitle : styles.subtitleA3}>
          Linjernas rutter / <span className={styles.italics}>Routes</span>
        </div>
      </div>
      <div className={styles.start}>
        <InlineSVG src={markerIcon} className={styles.icon} />
        <div className={classNames(styles.title, { [styles.titleA3]: printAsA3 })}>
          Olet tässä&nbsp;&nbsp;
          <span className={styles.subtitle}>Du är här&nbsp;&nbsp;</span>
          <span className={styles.subtitle}>You are here</span>
        </div>
      </div>
      <Path {...tree} />
    </div>
  );
};

RouteDiagram.defaultProps = {
  printAsA3: false,
  useWide: false,
  useCompactLayout: false,
};

RouteDiagram.propTypes = {
  tree: PropTypes.shape(Path.propTypes).isRequired,
  printAsA3: PropTypes.bool,
  useWide: PropTypes.bool,
  useCompactLayout: PropTypes.bool,
};

export default RouteDiagram;
