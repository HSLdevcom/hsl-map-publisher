import React from "react";
import PropTypes from "prop-types";

import styles from "./util.css";

const Row = props => (
    <div className={styles.row}>
        {props.children}
    </div>
);

Row.propTypes = {
    children: PropTypes.node.isRequired,
};

const JustifiedRow = props => (
    <div className={styles.justifiedRow} style={props.style}>
        {props.children}
    </div>
);

JustifiedRow.propTypes = {
    children: PropTypes.node.isRequired,
    style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

JustifiedRow.defaultProps = {
    style: {},
};

const WrappingRow = props => (
    <div className={styles.wrappingRow}>
        {props.children}
    </div>
);

WrappingRow.propTypes = {
    children: PropTypes.node.isRequired,
};

const Column = props => (
    <div className={styles.column}>
        {props.children}
    </div>
);

Column.propTypes = {
    children: PropTypes.node.isRequired,
};

const CenteringColumn = props => (
    <div className={styles.centeringColumn}>
        {props.children}
    </div>
);

CenteringColumn.propTypes = {
    children: PropTypes.node.isRequired,
};

const CenteringColumn = props => (
    <div className={styles.centeringColumn}>
        {props.children}
    </div>
);

CenteringColumn.propTypes = {
    children: React.PropTypes.node.isRequired,
};

const JustifiedColumn = props => (
    <div className={styles.justifiedColumn}>
        {props.children}
    </div>
);

JustifiedColumn.propTypes = {
    children: PropTypes.node.isRequired,
};

const Spacer = props => (
    <div style={{ flex: "0 0 auto", width: props.width, height: props.height }}/>
);

Spacer.defaultProps = {
    width: 0,
    height: 0,
};

Spacer.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
};

const FlexSpacer = () => <div style={{ flex: "2" }}/>;

const Image = props => (
    <img className={styles.image} role="presentation" {...props}/>
);

export {
    Row,
    JustifiedRow,
    WrappingRow,
    Column,
    CenteringColumn,
    JustifiedColumn,
    Spacer,
    FlexSpacer,
    Image,
};
