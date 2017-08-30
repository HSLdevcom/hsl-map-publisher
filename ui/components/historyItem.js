import React from "react";
import PropTypes from "prop-types";
import FlatButton from "material-ui/FlatButton";

import StatusBar from "components/statusBar";

import styles from "./historyItem.css";

const HistoryItem = props => (
    <div className={styles.root}>
        <div className={styles.row}>
            <h3>{props.id}</h3>
            <div className={styles.row}>
                <a href={`/output/${props.id}/`} target="_blank" rel="noopener noreferrer">
                    <FlatButton label="Selaa hakemistoa"/>
                </a>
                {props.filename &&
                    <a href={`/output/${props.id}/${props.filename}`} download>
                        <FlatButton label="Lataa PDF" primary/>
                    </a>
                }
            </div>
        </div>

        {props.error && <em>{`Generointi epäonnistui: ${props.error}`}</em>}
        {!props.error && <StatusBar
            total={props.pageCount}
            failure={props.pages.filter(({ filename }) => !filename).length}
            success={props.pages.filter(({ filename }) => filename).length}
        />}
    </div>
);

HistoryItem.defaultProps = {
    filename: null,
    error: null,
};

HistoryItem.propTypes = {
    id: PropTypes.string.isRequired,
    pageCount: PropTypes.number.isRequired,
    filename: PropTypes.string,
    error: PropTypes.string,
    pages: PropTypes.arrayOf(PropTypes.shape({
        component: PropTypes.string.isRequired,
        props: PropTypes.objectOf(PropTypes.any).isRequired,
        filename: PropTypes.string,
    })).isRequired,
};

export default HistoryItem;
