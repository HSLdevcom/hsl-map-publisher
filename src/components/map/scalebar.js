import React from "react";
import PropTypes from "prop-types";

import styles from "./scalebar.css";

const values = [1, 2, 4, 8];
const factors = [1, 10, 100, 1000, 10000];
const scales = factors.reduce((prev, cur) => [...prev, ...values.map(val => val * cur)], []);

const Scalebar = (props) => {
    const meters = props.targetWidth / props.pixelsPerMeter;
    const scale = scales.reduce((prev, cur) =>
        (Math.abs(cur - meters) < Math.abs(prev - meters) ? cur : prev), 0);
    return (
        <div className={styles.root}>
            <div>{scale} m</div>
            <div style={{ width: props.pixelsPerMeter * scale }}/>
        </div>
    );
};

Scalebar.propTypes = {
    targetWidth: PropTypes.number.isRequired,
    pixelsPerMeter: PropTypes.number.isRequired,
};

export default Scalebar;
