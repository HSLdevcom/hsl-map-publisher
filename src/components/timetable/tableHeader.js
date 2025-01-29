import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './tableHeader.css';

const TableHeader = props => {
  const header = props.printAsA3 ? (
    <div className={styles.inline}>
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
  ) : (
    <div className={styles.inline}>
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
  );
  return (
    <div
      className={classNames(styles.root, {
        [styles.largerPaddingTop]: props.printingAsA4,
        [styles.noPaddingTop]: props.printAsA3,
        [styles.compactPadding]: props.useCompactLayout,
        [styles.compactRoot]: props.useCompactLayout,
      })}>
      <div className={classNames(styles.title, { [styles.compactTitle]: props.useCompactLayout })}>
        <span className={styles.strong}>{props.title}</span>
        {header}
      </div>

      <div
        className={classNames(styles.subtitle, {
          [styles.compactSubtitle]: props.useCompactLayout,
        })}>
        <div className={styles.strong}>Tunti</div>
        <div>
          <span className={styles.strong}>min</span> / linja Ajat ovat arvioituja
        </div>
      </div>

      <div
        className={classNames(styles.subtitle, {
          [styles.compactSubtitle]: props.useCompactLayout,
        })}>
        <div className={styles.strong}>Timme</div>
        <div>
          <span className={styles.strong}>min</span> / linje Tiderna är beräknade
        </div>
      </div>

      <div
        className={classNames(styles.subtitle, {
          [styles.compactSubtitle]: props.useCompactLayout,
        })}>
        <div className={styles.strong}>Hour</div>
        <div>
          <span className={styles.strong}>min</span> / route The times are estimates
        </div>
      </div>
    </div>
  );
};

TableHeader.defaultProps = {
  printingAsA4: false,
  printAsA3: false,
  useCompactLayout: false,
};

TableHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitleSw: PropTypes.string.isRequired,
  subtitleEn: PropTypes.string.isRequired,
  printingAsA4: PropTypes.bool,
  printAsA3: PropTypes.bool,
  useCompactLayout: PropTypes.bool,
};

export default TableHeader;
