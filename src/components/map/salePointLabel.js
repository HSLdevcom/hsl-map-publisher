import React from 'react';
import PropTypes from 'prop-types';

import styles from './stopLabel.css';

const SalePointLabel = props => {
  // Round the distance to the next 50 meter
  const roundedDistance = Math.ceil(props.distance / 50) * 50;
  return (
    <div className={styles.label}>
      <div className={styles.title}>{props.title}</div>
      <div className={styles.subtitle}>{props.address}</div>
      <div className={styles.content}>
        <p>
          Lähin myyntipiste
          <br />
          Det närmaste försäljningsstället
          <br />
          The closest sales point
          <br />
          {`Etäisyys / Avståndet / Distance: ${roundedDistance} m`}
        </p>
      </div>
    </div>
  );
};

SalePointLabel.propTypes = {
  type: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  distance: PropTypes.number.isRequired,
};

export default SalePointLabel;
