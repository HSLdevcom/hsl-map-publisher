import React from "react";
import PropTypes from "prop-types";
import CircularProgress from "material-ui/CircularProgress";
import FlatButton from "material-ui/FlatButton";
import Divider from "material-ui/Divider";
import moment from "moment";

import StatusBar from "components/statusBar";

import styles from "./historyItem.css";

const HistoryItem = (props) => {
    const failedCount = props.pages.filter(({ filename }) => !filename).length;
    const successCount = props.pages.filter(({ filename }) => filename).length;
    const isInProgress = !props.error && ((failedCount + successCount) < props.pageCount);

    return (
        <div className={styles.root}>
            <div className={styles.row}>
                <div className={styles.title} title={props.title}>{props.title}</div>
                <div>{moment(props.date).format("D.M.YYYY HH:mm")}</div>
            </div>

            <StatusBar
                error={props.error}
                totalCount={props.pageCount}
                failedCount={failedCount}
                successCount={successCount}
            />
            <div className={styles.buttons}>
                <a href={`/output/${props.id}/`} target="_blank" rel="noopener noreferrer">
                    <FlatButton label="Selaa hakemistoa"/>
                </a>
                {props.filename &&
                <a href={`/output/${props.id}/${props.filename}`} download>
                    <FlatButton label="Lataa PDF" primary/>
                </a>
                }
                {isInProgress && <CircularProgress size={30} style={{ margin: "0 15px" }}/>}
            </div>
            <Divider/>
        </div>
    );
};

HistoryItem.defaultProps = {
    filename: null,
    error: null,
};

HistoryItem.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.number.isRequired,
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
