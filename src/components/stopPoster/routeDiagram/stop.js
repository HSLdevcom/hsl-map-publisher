import React from "react";

import styles from "./stop.css";

const Stop = props => (
    <div>
        <div className={styles.stop}>
            <div className={styles.left}/>
            <div className={styles.separator}>
                <div className={styles.separatorTop}/>
                <div className={styles.separatorSymbol}/>
                <div
                    className={styles.separatorBottom}
                    style={{ visibility: props.isLast ? "hidden" : "visible" }}
                />
            </div>
            <div className={styles.right}>
                <div className={styles.title}>{props.name_fi}</div>
                <div className={styles.subtitle}>{props.shortId} {props.address_fi}</div>
            </div>
        </div>

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

export default Stop;
