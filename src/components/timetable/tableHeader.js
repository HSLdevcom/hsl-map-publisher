import React from "react";
import PropTypes from "prop-types";

import styles from "./tableHeader.css";

const TableHeader = props => (
    <div className={styles.root}>
        <div className={styles.title}>
            <span className={styles.strong}>{props.titleFi}</span>
            &nbsp;&nbsp;
            {props.titleSe}
        </div>

        <div className={styles.subtitle}>
            <div className={styles.strong}>Tunti</div>
            <div><span className={styles.strong}>min</span> / linja Arvioidut ohitusajat</div>
        </div>

        <div className={styles.subtitle}>
            <div className={styles.strong}>Timme</div>
            <div><span className={styles.strong}>min</span> / linje Beräknade passertider</div>
        </div>
    </div>
);

TableHeader.propTypes = {
    titleFi: PropTypes.string.isRequired,
    titleSe: PropTypes.string.isRequired,
};

export default TableHeader;
