import React from "react";
import routeCompare from "util/routeCompare";

import styles from "./destinations.css";

const Destinations = props => (
    <div>
        {props.destinations &&
            <div className={styles.destinations}>
                {props.destinations.sort(routeCompare).map((route, index) =>
                    <div key={index} className={styles.destination}>
                        <div>{route.routeId}</div>
                        <div>{route.title}</div>
                    </div>
                )}
            </div>
        }
    </div>
);

export default Destinations;
