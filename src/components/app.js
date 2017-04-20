import React, { Component } from "react";
import queryString from "query-string";
import { ApolloClient, createNetworkInterface, ApolloProvider } from "react-apollo";

import StopPoster from "components/stopPoster/stopPoster";
import Timetable from "components/timetable/timetableContainer";

const components = {
    StopPoster,
    Timetable,
};

const client = new ApolloClient({
    networkInterface: createNetworkInterface({
        uri: "http://kartat.hsl.fi/jore/graphql",
    }),
});

class App extends Component {

    static stateFromQueryString() {
        const { component, props } = queryString.parse(location.hash);
        return (component && props) ? { component, props: JSON.parse(props) } : {};
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
     * @param {Object} props - Props passed to component
     */
    setVisibleComponent(component, props) {
        this.setState({ component, props });
    }

    render() {
        if (!components[this.state.component] || !this.state.props) {
            if (window.callPhantom) {
                window.callPhantom({ error: "Invalid component or props" });
            }
            return null;
        }

        const ComponentToRender = components[this.state.component];

        const onReady = (error) => {
            // Let phantom know the component is ready
            if (window.callPhantom) {
                if (error) {
                    window.callPhantom({ error: error.message });
                    return;
                }
                window.callPhantom({
                    width: this.root.offsetWidth,
                    height: this.root.offsetHeight,
                });
            } else if (error) {
                console.error(error); // eslint-disable-line no-console
            }
        };

        return (
            <div style={{ display: "inline-block" }} ref={(ref) => { this.root = ref; }}>
                <ApolloProvider client={client}>
                    <ComponentToRender {...this.state.props} onReady={onReady}/>
                </ApolloProvider>
            </div>
        );
    }
}

export default App;
