import React from "react";

import styles from "./destinations.css";

const Destinations = props => (
    <div>
        {props.destinations &&
            <div className={styles.destinations}>
                {props.destinations.map((route, index) =>
                    <div key={index} className={styles.destination}>
                        <div>{route.id}</div>
                        <div>{route.title}</div>
                    </div>
                )}
            </div>
        }
    </div>
);

export default Destinations;
