import React from 'react';
import PropTypes from 'prop-types';

import styles from './stopLabel.css';

const SalePointLabel = props => {
  // Round the distance to the next 50 meter
  const roundedDistance = Math.ceil(props.distance / 50) * 50;

  return (
    <div className={styles.label}>
      <div className={styles.flexContainer}>
        <div className={styles.comma} style={{ width: 32, height: 32 }}>
          {props.icon}
        </div>
        <div>
          <div className={styles.title}>{props.title}</div>
          <div className={styles.subtitle}>{props.address}</div>
        </div>
      </div>
      <div className={styles.subtitle}>{`(${roundedDistance} metriä / meter / meters)`}</div>
      <div className={styles.content}>
        <div className={styles.flexContainer}>
          <span className={styles.salesPoint}>
            Lähin myyntipiste
            <br />
            Det närmaste försäljningsstället
            <br />
            The closest sales point
          </span>
        </div>
      </div>
    </div>
  );
};

SalePointLabel.propTypes = {
  type: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  distance: PropTypes.number.isRequired,
  icon: PropTypes.element.isRequired,
};

export default SalePointLabel;
