import React from "react";
import markerIcon from "icons/marker.svg";
import { routesToPaths } from "util/routes";

import Path from "./path";
import styles from "./routeDiagram.css";

const RouteDiagram = (props) => {
    const path = routesToPaths(props.stop, props.routes);
    return (
        <div className={styles.root}>
            <div className={styles.start}>
                <img src={markerIcon} className={styles.icon} role="presentation"/>
                <div className={styles.title}>Olet tässä</div>
            </div>
            <Path {...path}/>
        </div>
    );
};

export default RouteDiagram;
