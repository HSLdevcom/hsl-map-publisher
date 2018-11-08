import React from 'react';
import PropTypes from 'prop-types';

const MASK_MARGIN = 5;

const Line = props => (
  <path
    d={`M${props.x} ${props.y} L${props.x + props.cx} ${props.y + props.cy}`}
    fill="none"
    stroke="#333333"
    strokeWidth="2"
    clipPath={`url(#label-mask-${props.index})`}
  />
);

const LineItemPropTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  cx: PropTypes.number.isRequired,
  cy: PropTypes.number.isRequired,
};

Line.propTypes = {
  ...LineItemPropTypes,
  index: PropTypes.number.isRequired,
};

const ClipPath = props => (
  <clipPath id={`label-mask-${props.index}`}>
    <path
      d={`
                M0 0 h${props.totalWidth} v${props.totalHeight} H0z
                M${props.x + props.cx - props.width / 2 + MASK_MARGIN}
                 ${props.y + props.cy - props.height / 2 + MASK_MARGIN}
                v${props.height - 2 * MASK_MARGIN}
                h${props.width - 2 * MASK_MARGIN}
                v-${props.height - 2 * MASK_MARGIN}z
              `}
    />
  </clipPath>
);

const ClipPathItemPropTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  cx: PropTypes.number.isRequired,
  cy: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

ClipPath.propTypes = {
  ...ClipPathItemPropTypes,
  totalWidth: PropTypes.number.isRequired,
  totalHeight: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

const ItemOverlay = props => (
  <svg width={props.width} height={props.height}>
    <defs>
      {props.items.map((item, index) => (
        <ClipPath
          key={index}
          index={index}
          totalWidth={props.width}
          totalHeight={props.height}
          {...item}
        />
      ))}
    </defs>
    {props.items.map((item, index) => (
      <Line key={index} index={index} {...item} />
    ))}
  </svg>
);

ItemOverlay.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      ...LineItemPropTypes,
      ...ClipPathItemPropTypes,
    }),
  ).isRequired,
};

export default ItemOverlay;
