import React from "react";
import PropTypes from "prop-types";

import styles from "./tableHeader.css";

const TableHeader = props => (
    <div className={styles.root}>
        <div className={styles.title}>
            <span className={styles.strong}>{props.title}</span>
            &nbsp;&nbsp;
            {props.subtitle}
        </div>

        <div className={styles.subtitle}>
            <div className={styles.strong}>Tunti</div>
            <div><span className={styles.strong}>min</span> / linja Ajat ovat arvioituja</div>
        </div>

        <div className={styles.subtitle}>
            <div className={styles.strong}>Timme</div>
            <div><span className={styles.strong}>min</span> / linje Tiderna är beräknade</div>
        </div>
    </div>
);

TableHeader.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
};

export default TableHeader;
