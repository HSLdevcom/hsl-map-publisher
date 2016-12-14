import React, { Component } from "react";
import queryString from "query-string";

import StopPoster from "components/stopPoster/stopPoster.js";

const components = {
    StopPoster,
};

class App extends Component {

    static stateFromQueryString() {
        const { component, options } = queryString.parse(location.hash);
        return (component && options) ? { component, options: JSON.parse(options) } : {};
    }

    constructor() {
        super();
        // In development we'll use url hash to set initial state
        this.state = App.stateFromQueryString();
        // Publish method as a global to make it accessible from phantom
        window.setVisibleComponent = this.setVisibleComponent;
    }

    componentDidUpdate() { // eslint-disable-line class-methods-use-this
        // Let phantom know we're ready for a screenshot
        if (window.callPhantom) window.callPhantom();
    }

    /**
     * Sets component to render
     * @param {String} component - Name of component to display
     * @param {Object} options - Options passed to component
     */
    setVisibleComponent(component, options) {
        this.setState({ component, options });
    }

    render() {
        if (!this.state.component || !this.state.options) return null;
        const ComponentToRender = components[this.state.component];
        return ComponentToRender ? <ComponentToRender {...this.state.options}/> : null;
    }
}

export default App;
