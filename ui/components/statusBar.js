import React from "react";
import PropTypes from "prop-types";

import styles from "./statusBar.css";

const StatusBar = props => (
    <div className={styles.root}>
        {props.error &&
            <div className={styles.text} title={props.error}>
                {`Generointi epäonnistui: ${props.error}`}
            </div>
        }
        {!props.error &&
            <div className={styles.text}>
                {`${props.successCount} / ${props.totalCount} sivua generoitu`}
                {props.failedCount > 0 && ` (${props.failedCount} epäonnistunut)`}
            </div>
        }
    </div>
);

StatusBar.defaultProps = {
    error: null,
};

StatusBar.propTypes = {
    error: PropTypes.string,
    totalCount: PropTypes.number.isRequired,
    successCount: PropTypes.number.isRequired,
    failedCount: PropTypes.number.isRequired,
};

export default StatusBar;
