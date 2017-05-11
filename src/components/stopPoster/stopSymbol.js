import React from "react";
import PropTypes from "prop-types";

import { isTrunkRoute } from "util/domain";

const outlineWidth = 5;

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
    if (modes.includes("BUS") && props.routes.some(({ routeId }) => !isTrunkRoute(routeId))) {
        colors.push(colorsByMode.BUS);
    }
    if (modes.includes("TRAM")) {
        colors.push(colorsByMode.TRAM);
    }
    if (modes.includes("RAIL")) {
        colors.push(colorsByMode.RAIL);
    }
    if (modes.includes("METRO")) {
        colors.push(colorsByMode.SUBWAY);
    }

    const innerSize = props.size - 2 - (Math.min(colors.length, 2) * outlineWidth);
    const outerSize = props.size + ((colors.length - 1) * outlineWidth);
    const center = Math.floor(outerSize / 2);

    const outlines = colors.map((color, index) => ({
        color,
        radius: (innerSize / 2) + (index * outlineWidth) + (index + 1 < colors.length ? 1 : 0),
        width: outlineWidth + (index + 1 < colors.length ? 1 : 0),
    }));
    return (
        <svg width={outerSize} height={outerSize} style={{ display: "block" }}>
            <circle cx={center} cy={center} r={innerSize / 2} fill="#fff"/>
            {outlines.map(({ radius, color, width }, index) => (
                <circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={width}
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
