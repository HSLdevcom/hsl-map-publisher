import React from "react";
import { Row, Column } from "components/util";

import styles from "./stop.css";

const Stop = (props) => (
    <div className={styles.root}>
        <div className={styles.left}>{props.duration} {props.isFirst && "min"}</div>
        <div className={styles.separator}>
            <div className={styles.separatorTop}/>
            <div className={styles.separatorSymbol}/>
            <div className={styles.separatorBottom} style={{ visibility: props.isLast ? "hidden" : "visible" }}/>
        </div>
        <div className={styles.right}>
            <div className={styles.title}>{props.name_fi}</div>
            <div className={styles.subtitle}>{props.shortId} {props.address_fi}</div>
        </div>
    </div>
);

export default Stop;
