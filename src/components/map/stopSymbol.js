import React from 'react';
import PropTypes from 'prop-types';

import { colorsByMode } from 'util/domain';

import styles from './stopLabel.css';

const strokeWidth = 5;

const StopSymbol = props => {
  const modes = [...new Set(props.routes.map(({ mode }) => mode))];
  const colors = [];
  if (props.routes.some(route => route.trunkRoute)) {
    colors.push(colorsByMode.TRUNK);
  }
  modes.forEach(mode => {
    colors.push(colorsByMode[mode]);
  });

  const maxRadius = props.size / 2 - (strokeWidth / 2) * (4 - colors.length);

  const outlines = colors.map((color, index) => {
    const radius = maxRadius - index * (strokeWidth + 1);
    return { color, radius };
  });
  return (
    <svg width={props.size} height={props.size} style={{ display: 'block' }}>
      <circle cx={props.size / 2} cy={props.size / 2} r={outlines[0].radius} fill="#fff" />
      {outlines.map(({ radius, color }, index) => (
        <circle
          key={index}
          cx={props.size / 2}
          cy={props.size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      ))}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="bold"
        className={styles.route}
        x={props.size / 2}
        y={props.size / 2 + 1}
        fill={colors.pop()}
        fontSize="10.5">
        {props.platform}
      </text>
    </svg>
  );
};

StopSymbol.defaultProps = {
  platform: null,
};

StopSymbol.propTypes = {
  size: PropTypes.number.isRequired,
  platform: PropTypes.string,
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      routeId: PropTypes.string.isRequired,
      mode: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default StopSymbol;
