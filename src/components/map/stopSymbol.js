import React from "react";
import PropTypes from "prop-types";

import { isTrunkRoute } from "util/domain";

const strokeWidth = 5;

const colorsByMode = {
    TRUNK: "#f25d21",
    TRAM: "#00985f",
    RAIL: "#8c4799",
    SUBWAY: "#ff6319",
    BUS: "#007AC9",
};

const StopSymbol = (props) => {
    const modes = [...new Set(props.routes.map(({ mode }) => mode))];
    const colors = [];

    if (props.routes.some(({ routeId }) => isTrunkRoute(routeId))) {
        colors.push(colorsByMode.TRUNK);
    }
    if (modes.includes("TRAM")) {
        colors.push(colorsByMode.TRAM);
    }
    if (modes.includes("RAIL")) {
        colors.push(colorsByMode.RAIL);
    }
    if (modes.includes("SUBWAY")) {
        colors.push(colorsByMode.SUBWAY);
    }
    if (modes.includes("BUS") && props.routes.some(({ routeId }) => !isTrunkRoute(routeId))) {
        colors.push(colorsByMode.BUS);
    }

    const outlines = colors.map((color, index) => {
        const maxRadius = (props.size / 2) - ((strokeWidth / 2) * (4 - colors.length));
        const radius = maxRadius - (index * (strokeWidth + 1));
        return { color, radius };
    });

    return (
        <svg width={props.size} height={props.size} style={{ display: "block" }}>
            <circle
                cx={props.size / 2}
                cy={props.size / 2}
                r={outlines[0].radius}
                fill="#fff"
            />
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
        </svg>
    );
};

StopSymbol.propTypes = {
    size: PropTypes.number.isRequired,
    routes: PropTypes.arrayOf(PropTypes.shape({
        routeId: PropTypes.string.isRequired,
        mode: PropTypes.string.isRequired,
    })).isRequired,
};

export default StopSymbol;
