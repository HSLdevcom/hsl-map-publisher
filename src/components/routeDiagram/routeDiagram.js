import React from "react";
import PropTypes from "prop-types";

import { InlineSVG } from "components/util";
import markerIcon from "icons/marker.svg";

import Path from "./path";
import styles from "./routeDiagram.css";

const RouteDiagram = props => (
    <div className={styles.root}>
        <div className={styles.componentName}>
            <div className={styles.title}>
                Linjojen reitit
            </div>
            <div className={styles.subtitle}>
                Linjernas rutter
            </div>
        </div>
        <div className={styles.start}>
            <InlineSVG src={markerIcon} className={styles.icon}/>
            <div className={styles.title}>
                    Olet tässä&nbsp;&nbsp;
                <span className={styles.subtitle}>
                    Du är här
                </span>
            </div>
        </div>
        <Path {...props.tree}/>
    </div>
);

RouteDiagram.propTypes = {
    tree: PropTypes.shape(Path.propTypes).isRequired,
};

export default RouteDiagram;
