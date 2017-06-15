import React from "react";

import styles from "./zone.css";

const Stop = props => (
    <div className={styles.zone}>
        <div className={styles.left}/>
        <div className={styles.separator}>
            <div className={styles.separatorTop}/>
            <div className={styles.separatorMiddle}/>
            <div className={styles.separatorBottom}/>
        </div>
        <div className={styles.right}>
            {props.from
                ? <div className={styles.title}>{props.from}</div>
                : <div className={styles.noZone}/>}
            <svg className={styles.border}>
                <line x1="1" x2="98%" y1="2" y2="2" className={styles.line}/>
            </svg>
            {props.to
                ? <div className={styles.title}>{props.to}</div>
                : <div className={styles.noZone}/>
            }
        </div>
    </div>
);

export default Stop;
