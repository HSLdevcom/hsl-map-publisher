import React from "react";

import styles from "./stop.css";

const Stop = props => (
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
            <div className={styles.subtitle}>{props.name_se}</div>
        </div>
    </div>
);

export default Stop;
