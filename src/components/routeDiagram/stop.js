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
            <div className={styles.title}>{props.nameFi}</div>
            <div className={styles.subtitle}>{props.nameSe}</div>
        </div>
    </div>
);

export default Stop;
