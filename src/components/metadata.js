import React from "react";
import PropTypes from "prop-types";

import styles from "./metadata.css";

export default function Metadata({ date }) {
    const opts = { year: "numeric", month: "numeric", day: "numeric" };
    const today = new Date().toLocaleDateString("sv", opts);

    return (
        <div className={styles.metadata}>
            {"Generointi: "}
            {today}
            {"\u00a0\u00a0"}
            {"Poikkileikkaus: "}
            {date}
        </div>
    );
}

Metadata.propTypes = {
    date: PropTypes.string.isRequired,
};
