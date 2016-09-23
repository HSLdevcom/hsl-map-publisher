import React from "react";
import markerIcon from "icons/marker.svg";

import Path from "./path";
import styles from "./routeDiagram.css";

const paths = {
    stops: [1,2,3],
    subpaths: [
        {
            stops: [4,5],
            subpaths: [
                {
                    stops: [1, 2, 3],
                },
                {
                    stops: [1, 2, 3],
                }
            ]
        },
        {
            id: 3,
            stops: [6],
        }
    ]
};

const RouteDiagram = () => (
    <div className={styles.root}>
        <div className={styles.start}>
            <img src={markerIcon} className={styles.icon} role="presentation"/>
            <div className={styles.title}>Olet tässä</div>
        </div>
        <Path {...paths}/>
    </div>
);

export default RouteDiagram;
