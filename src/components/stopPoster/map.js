import React from "react";

import styles from "./map.css";

const Map = props => (
    <div className={styles.root}>
        <div className={styles.container}>
            <img src={props.mapImage} role="presentation"/>
        </div>
        <div className={styles.miniMap}>
            <div className={styles.container}>
                <img src={props.miniMapImage} role="presentation"/>
            </div>
        </div>
    </div>
);

export default Map;
