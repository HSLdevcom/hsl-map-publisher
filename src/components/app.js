import React, { Component } from "react";
import queryString from "query-string";

import StopPoster from "components/stopPoster/stopPoster.js";
import { fetchStopInfo } from "util/api";

/**
 * Fetches stop info and dispatches an event to set corresponding view
 * @param {Number} id - Stop identifier
 */
window.setView = (id) => {
    fetchStopInfo(id)
        .then((data) => {
            const event = new CustomEvent("app:update", { detail: { id, data } });
            window.dispatchEvent(event);
        }).catch(() => {
            // Throw new error outside the promise chain to trigger phantom's onError callback
            setTimeout(() => {
                throw new Error(`Failed to fetch stop info (id: ${id})`);
            });
        });
};

// In development mode we'll use url hash to set view
const params = queryString.parse(location.hash);
if(params.id) window.setView(params.id);

class App extends Component {
    constructor() {
        super();
        this.state = {};
        this.updateView = this.updateView.bind(this);
    }

    componentDidMount() {
        window.addEventListener("app:update", this.updateView);
    }

    componentDidUpdate() {
        // Let phantom know we're ready for a screenshot
        if (window.callPhantom) window.callPhantom();
    }

    componentWillUnmount() {
        window.removeEventListener("app:update", this.updateView);
    }

    updateView(event) {
        this.setState(event.detail);
    }

    render() {
        return this.state.data ? <StopPoster {...this.state.data}/> : null;
    }
}

export default App;
