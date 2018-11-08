import React from 'react';

import styles from './gap.css';

const lineWidth = 2;
const lineColor = '#007AC9';
const repeatHeight = 5;
const dotCount = 5;

const rootStyle = {
  marginTop: -repeatHeight / 2,
  marginBottom: -repeatHeight / 2,
};

const Dot = () => (
  <svg width={lineWidth} height={repeatHeight}>
    <circle cx={lineWidth / 2} cy={repeatHeight / 2} r={lineWidth / 2} fill={lineColor} />
  </svg>
);

const Gap = () => {
  const dots = [];
  for (let i = 0; i < dotCount; i++) {
    dots.push(<Dot key={i} />);
  }

  return (
    <div className={styles.root} style={rootStyle}>
      {dots}
    </div>
  );
};

export default Gap;
