import React from "react";
import markerIcon from "icons/marker.svg";
import { routesToTree } from "util/routes";

import Path from "./path";
import styles from "./routeDiagram.css";

const RouteDiagram = (props) => {
    const tree = routesToTree(props.stop, props.routes);
    return (
        <div className={styles.root}>
            <div className={styles.start}>
                <img src={markerIcon} className={styles.icon} role="presentation"/>
                <div className={styles.title}>Olet tässä</div>
            </div>
            <Path {...tree}/>
        </div>
    );
};

export default RouteDiagram;
