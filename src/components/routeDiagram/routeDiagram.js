import React from "react";
import { InlineSVG } from "components/util";
import markerIcon from "icons/marker.svg";

import Path from "./path";
import styles from "./routeDiagram.css";

const RouteDiagram = props => (
    props.tree.length === 0
        ? null
        : <div className={styles.root}>
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
                    <span className={styles.subtitle}>Du är här</span>
                </div>
            </div>
            <Path {...props.tree}/>
        </div>
    );

export default RouteDiagram;
