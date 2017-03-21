import React, { Component } from "react";
import queryString from "query-string";
import { ApolloClient, createNetworkInterface, ApolloProvider } from "react-apollo";

import StopPoster from "components/stopPoster/stopPoster";

const components = {
    StopPoster,
};

const client = new ApolloClient({
    networkInterface: createNetworkInterface({
        uri: "http://kartat.hsl.fi/jore/graphql",
    }),
});

class App extends Component {

    static stateFromQueryString() {
        const { component, options } = queryString.parse(location.hash);
        return (component && options) ? { component, options: JSON.parse(options) } : {};
    }

    constructor() {
        super();
        // In development we'll use url hash to set initial state
        this.state = App.stateFromQueryString();
    }

    componentDidMount() {
        // Publish method as a global to make it accessible from phantom
        window.setVisibleComponent = this.setVisibleComponent.bind(this);
        // Let phantom know app is ready
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
        if (!ComponentToRender) return null;

        const onReady = (error) => {
            if (error) console.error(error); // eslint-disable-line no-console
            // Let phantom know the component is ready
            if (window.callPhantom) {
                const options = {
                    width: this.root.offsetWidth,
                    height: this.root.offsetHeight,
                };
                window.callPhantom(options);
            }
        };

        return (
            <div style={{ display: "inline-block" }} ref={(ref) => { this.root = ref; }}>
                <ApolloProvider client={client}>
                    <ComponentToRender {...this.state.options} onReady={onReady}/>
                </ApolloProvider>
            </div>
        );
    }
}

export default App;
