import React from 'react';
import PropTypes from 'prop-types';
import styles from './header.css';

function ZoneIcon({ zone }) {
  // All letters sit a bit differently in the circle. Oh well.
  const zoneLetterStyle = {
    transform:
      zone === 'B'
        ? 'translate(calc(-50% + 3px), calc(-50% + 6px))'
        : zone === 'C'
        ? 'translate(calc(-50% - 4px), calc(-50% + 7px))'
        : zone === 'D'
        ? 'translate(calc(-50% + 6px), calc(-50% + 7px))'
        : 'translate(-50%, -50%)', // No px adjustments for zone A and the "else" case.
    fontSize: '140px',
  };

  return (
    <div className={styles.zone}>
      <span className={styles.zoneLetter} style={zoneLetterStyle}>
        {zone}
      </span>
    </div>
  );
}

ZoneIcon.propTypes = {
  zone: PropTypes.string.isRequired,
};

export default ZoneIcon;
