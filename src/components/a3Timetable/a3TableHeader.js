import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { InlineSVG } from 'components/util';
import timeLogo from '../../icons/time.svg';

import styles from './a3TableHeader.css';

const a3TableHeader = props => (
  <div className={classNames(styles.root)}>
    <div className={styles.title}>
      <span className={styles.strong}>{props.title}</span>
      <span>
        {' '}
        &nbsp;&nbsp;
        {props.subtitleSw}
      </span>
      <span className={styles.italics}>
        &nbsp;&nbsp;
        {props.subtitleEn}
      </span>
    </div>
    <div className={styles.subtitle}>
      <InlineSVG className={classNames(styles.timeLogo)} src={timeLogo} />

      <div className={styles.subtitleContent}>min {props.extended ? '/' : ''}</div>
      <div className={styles.subtitleContent}>linja</div>
      <div className={styles.subtitleContent}>linje</div>
      <div className={styles.subtitleContent}>route</div>
      <div className={styles.subtitleContentExtraPadding}>Ajat ovat arvioituja</div>
      <div className={styles.subtitleContent}>Tiderna är beräknade</div>
      <div className={styles.subtitleContent}>The times are estimates</div>
    </div>
  </div>
);

a3TableHeader.defaultProps = {
  extended: false,
};

a3TableHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitleSw: PropTypes.string.isRequired,
  subtitleEn: PropTypes.string.isRequired,
  extended: PropTypes.bool,
};

export default a3TableHeader;
