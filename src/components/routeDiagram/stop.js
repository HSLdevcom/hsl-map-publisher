import React from 'react';
import PropTypes from 'prop-types';

import { InlineSVG } from 'components/util';
import { iconsByMode } from 'util/domain';

import styles from './stop.css';

const metroRegexp = / ?\(M\)$/;

const Stop = props => {
  const modes = new Set();
  if (metroRegexp.test(props.nameFi)) modes.add('SUBWAY');
  props.transferModes.forEach(mode => modes.add(mode));

  return (
    <div className={styles.root}>
      <div className={styles.left} />
      <div className={styles.separator}>
        <div className={styles.separatorTop} />
        <div className={props.isLast ? styles.separatorLastStop : styles.separatorStop} />
        <div
          className={styles.separatorBottom}
          style={{ visibility: props.isLast ? 'hidden' : 'visible' }}
        />
      </div>
      <div className={styles.right}>
        <div>
          <div className={styles.title}>{props.nameFi.replace(metroRegexp, '')}</div>
          <div className={styles.subtitle}>
            {props.nameSe && props.nameSe.replace(metroRegexp, '')}
          </div>
        </div>
        <div className={styles.iconContainer}>
          {Array.from(modes).map((mode, index) => (
            <InlineSVG key={index} className={styles.icon} src={iconsByMode[mode]} />
          ))}
        </div>
      </div>
    </div>
  );
};

Stop.defaultProps = {
  nameSe: null,
};

Stop.propTypes = {
  nameFi: PropTypes.string.isRequired,
  nameSe: PropTypes.string,
  isLast: PropTypes.bool.isRequired,
  transferModes: PropTypes.arrayOf(PropTypes.oneOf(['BUS', 'TRAM', 'FERRY', 'RAIL', 'SUBWAY']))
    .isRequired,
};

export default Stop;
