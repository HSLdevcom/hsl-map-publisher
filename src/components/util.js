import React from "react";

import styles from "./util.css";

const Row = props => (
    <div className={styles.row}>
        {props.children}
    </div>
);

const JustifiedRow = props => (
    <div className={styles.justifiedRow}>
        {props.children}
    </div>
);

const WrappingRow = props => (
    <div className={styles.wrappingRow}>
        {props.children}
    </div>
);

const Column = props => (
    <div className={styles.column}>
        {props.children}
    </div>
);

const JustifiedColumn = props => (
    <div className={styles.justifiedColumn}>
        {props.children}
    </div>
);

const Spacer = props => (
    <div style={{ flex: "0 0 auto", width: props.width || 0, height: props.height || 0 }}/>
);

const FlexSpacer = () => <div style={{ flex: "2" }}/>;

const Image = props => (
    <img className={styles.image} role="presentation" {...props}/>
);


export {
    Row,
    JustifiedRow,
    WrappingRow,
    Column,
    JustifiedColumn,
    Spacer,
    FlexSpacer,
    Image,
};
