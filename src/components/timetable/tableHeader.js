import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import styles from './tableHeader.css';

const TableHeader = props => (
  <div
    className={classNames(styles.root, {
      [styles.largerPaddingTop]: props.printingAsA4,
    })}>
    <div className={styles.title}>
      <span className={styles.strong}>{props.title}</span>
      &nbsp;&nbsp;
      {props.subtitleSw}
      &nbsp;&nbsp;
      {props.subtitleEn}
    </div>

    <div className={styles.subtitle}>
      <div className={styles.strong}>Tunti</div>
      <div>
        <span className={styles.strong}>min</span> / linja Ajat ovat arvioituja
      </div>
    </div>

    <div className={styles.subtitle}>
      <div className={styles.strong}>Timme</div>
      <div>
        <span className={styles.strong}>min</span> / linje Tiderna är beräknade
      </div>
    </div>

    <div className={styles.subtitle}>
      <div className={styles.strong}>Hour</div>
      <div>
        <span className={styles.strong}>min</span> / route The times are estimates
      </div>
    </div>
  </div>
);

TableHeader.defaultProps = {
  printingAsA4: false,
};

TableHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitleSw: PropTypes.string.isRequired,
  subtitleEn: PropTypes.string.isRequired,
  printingAsA4: PropTypes.bool,
};

export default TableHeader;
