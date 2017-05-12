import React from "react";
import PropTypes from "prop-types";

import styles from "./scalebar.css";

const Scalebar = (props) => {
    const meters = Math.ceil((props.targetWidth / props.pixelsPerMeter) / 100) * 100;
    return (
        <div className={styles.root}>
            <div>{meters} m</div>
            <div style={{ width: props.pixelsPerMeter * meters }}/>
        </div>
    );
};

Scalebar.propTypes = {
    targetWidth: PropTypes.number.isRequired,
    pixelsPerMeter: PropTypes.number.isRequired,
};

export default Scalebar;
