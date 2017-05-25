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

    if (modes.includes("BUS") && props.routes.some(({ routeId }) => !isTrunkRoute(routeId))) {
        colors.push(colorsByMode.BUS);
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
    if (props.routes.some(({ routeId }) => isTrunkRoute(routeId))) {
        colors.push(colorsByMode.TRUNK);
    }

    const innerSize = props.size - (Math.min(colors.length, 2) * outlineWidth);
    const outerSize = props.size + ((colors.length - 1) * (outlineWidth + 1));
    const center = Math.floor(outerSize / 2);

    const outlines = colors.map((color, index) => ({
        color,
        radius: (innerSize / 2) + (index * (outlineWidth + 1)),
        width: outlineWidth,
    }));
    return (
        <svg width={outerSize} height={outerSize} style={{ display: "block" }}>
            <circle cx={center} cy={center} r={(outerSize / 2) - 2} fill="#fff"/>
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
