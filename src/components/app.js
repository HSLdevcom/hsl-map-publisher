import React, { Component } from "react";
import queryString from "query-string";

import StopPoster from "components/stopPoster/stopPoster.js";
import { fetchStop, fetchRoutes } from "util/api";

/**
 * Fetches data from API and dispatches an event to set corresponding view
 * @param {Number} id - Stop identifier
 */
window.setView = (id) => {
    Promise.all([fetchStop(id), fetchRoutes(id)])
        .then(([stop, routes]) => {
            const event = new CustomEvent("app:update", { detail: { data: { stop, routes } } });
            window.dispatchEvent(event);
        }).catch((error) => {
            setTimeout(() => {
                // Throw new error outside the promise chain to trigger phantom's onError callback
                throw new Error(`Failed to fetch stop info (id: ${id})`);
            });
        });
};

// In development mode we'll use url hash to set view
const params = queryString.parse(location.hash);
if (params.id) window.setView(params.id);

class App extends Component {
    constructor() {
        super();
        this.state = {};
        this.updateView = this.updateView.bind(this);
    }

    componentDidMount() {
        window.addEventListener("app:update", this.updateView);
    }

    componentDidUpdate() { // eslint-disable-line class-methods-use-this
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
