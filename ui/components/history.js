import React, { Component } from "react";
import PropTypes from "prop-types";
import FlatButton from "material-ui/FlatButton";

import StatusBar from "components/statusBar";

import { fetchBuilds } from "util/api";

import styles from "./history.css";

const HistoryItem = props => (
    <div className={styles.item}>
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

        {props.error && <em>`Generointi epäonnistui: ${props.error}`</em>}
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

class History extends Component {
    constructor() {
        super();
        this.state = { builds: {} };
    }

    componentDidMount() {
        fetchBuilds()
            .then(builds => this.setState({ builds }))
            // FIXME: Show error in modal window
            .catch(error => console.error(error)); // eslint-disable-line no-console
    }

    render() {
        return (
            <div className={styles.root}>
                {Object.keys(this.state.builds).sort((a, b) => a - b).map(
                    key => <HistoryItem id={key} {...this.state.builds[key]}/>
                )}
            </div>
        );
    }
}

export default History;
