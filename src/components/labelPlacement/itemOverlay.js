import React from "react";
import PropTypes from "prop-types";

const MASK_MARGIN = 5;

const Line = props => (
    <path
        d={`M${props.x} ${props.y} L${props.x + props.cx} ${props.y + props.cy}`}
        fill="none"
        stroke="#333333"
        strokeWidth="2"
    />
);

Line.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    cx: PropTypes.number.isRequired,
    cy: PropTypes.number.isRequired,
};

const Mask = props => (
    <rect
        x={props.left + MASK_MARGIN}
        y={props.top + MASK_MARGIN}
        width={props.width - (MASK_MARGIN * 2)}
        height={props.height - (MASK_MARGIN * 2)}
        fill="#000"
    />
);

Mask.propTypes = {
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
};

const ItemOverlay = props => (
    <svg width={props.width} height={props.height}>
        <defs>
            <mask id="label-mask" x="0" y="0" width="1" height="1">
                <rect width={props.width} height={props.height} fill="#fff"/>
                {props.items.map((item, index) => <Mask key={index} {...item}/>)}
            </mask>
        </defs>
        <g mask="url(#label-mask)">
            {props.items.map((item, index) => <Line key={index} {...item}/>)}
        </g>
    </svg>
);

ItemOverlay.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    items: PropTypes.arrayOf(
        PropTypes.shape({
            ...Line.propTypes,
            ...Mask.propTypes,
        })
    ).isRequired,
};

export default ItemOverlay;
