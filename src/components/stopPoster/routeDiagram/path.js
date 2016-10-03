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

        {props.routes &&
        <div className={styles.routes}>
            {props.routes.map((route, index) =>
                <div key={index} className={styles.route}>
                    <div>{route.routeId}</div>
                    <div>{route.destination_fi}</div>
                </div>
            )}
        </div>
        }
    </div>
);

export default Path;
