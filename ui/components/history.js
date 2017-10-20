import React, { Component } from "react";
import PropTypes from "prop-types";

import HistoryItem from "components/historyItem";

import { fetchBuilds } from "util/api";

import styles from "./history.css";


class History extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.intervalId = setInterval(() => this.updateBuilds(), 5000);
        this.updateBuilds();
    }

    componentWillUnmount() {
        clearTimeout(this.intervalId);
        this.intervalId = null;
    }

    updateBuilds() {
        if (!this.state.builds || document.visibilityState === "visible") {
            fetchBuilds()
                .then((builds) => {
                    if (this.intervalId) this.setState({ builds });
                })
                .catch((error) => {
                    this.props.onMessage(`Tietojen hakeminen epäonnistui: ${error.message}`);
                    console.error(error); // eslint-disable-line no-console
                });
        }
    }

    render() {
        if (!this.state.builds) {
            return null;
        }
        return (
            <div className={styles.root}>
                {Object.keys(this.state.builds).sort((a, b) => -a.localeCompare(b)).map(
                    key => <HistoryItem key={key} id={key} {...this.state.builds[key]}/>
                )}
            </div>
        );
    }
}

History.propTypes = {
    onMessage: PropTypes.func.isRequired,
};

export default History;
