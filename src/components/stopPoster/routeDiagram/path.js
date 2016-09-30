import React from "react";
import markerIcon from "icons/marker.svg";

import Stop from "./stop.js";
import styles from "./path.css";

const Path = props => (
    <div className={styles.root}>
        <div className={props.connectLeft ? styles.headerCurved : styles.header}/>
        {props.stops && props.stops.map((stop, index) =>
            <Stop key={index} {...stop} isFirst={!index} isLast={!props.subpaths && index === props.stops.length - 1}/>
        )}

        {props.subpaths &&
        <div>
            <div className={styles.footer}/>
            <div className={styles.subpaths}>
                {props.subpaths.map((path, index) => <Path key={index} {...path} connectLeft={index > 0}/>)}
            </div>
        </div>
        }
    </div>
);

export default Path;
