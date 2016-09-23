import React from "react";
import { Row, Column } from "components/util";

import styles from "./stop.css";

const stops = [
    {
        id: 1,
        name_fi: "Töölön tulli, Laituri 3",
        number: "H1764",
        address_fi: "Mannerheimintie"
    },
    {
        id: 2,
        name_fi: "Töölön tulli, Laituri 3",
        number: "H1764",
        address_fi: "Mannerheimintie"
    },
    {
        id: 3,
        name_fi: "Töölön tulli, Laituri 3",
        number: "H1764",
        address_fi: "Mannerheimintie"
    },
    {
        id: 4,
        name_fi: "Töölön tulli, Laituri 3",
        number: "H1764",
        address_fi: "Mannerheimintie"
    },
    {
        id: 5,
        name_fi: "Töölön tulli, Laituri 3",
        number: "H1764",
        address_fi: "Mannerheimintie"
    },
    {
        id: 6,
        name_fi: "Töölön tulli, Laituri 3",
        number: "H1764",
        address_fi: "Mannerheimintie"
    }
];

const Stop = (props) => {
    const stop = stops.find(stop => stop.id === props.id);
    return (
        <div className={styles.root}>
            <div className={styles.left}>3 {props.isFirst && "min"}</div>
            <div className={styles.separator}>
                <div className={styles.separatorTop}/>
                <div className={styles.separatorSymbol}/>
                <div className={styles.separatorBottom} style={{ visibility: props.isLast ? "hidden" : "visible" }}/>
            </div>
            <div className={styles.right}>
                <div className={styles.title}>{stop.name_fi}</div>
                <div className={styles.subtitle}>{stop.number} {stop.address_fi}</div>
            </div>
        </div>
    );
};

export default Stop;
