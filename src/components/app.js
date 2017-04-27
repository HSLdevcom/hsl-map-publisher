import React, { Component } from "react";
import queryString from "query-string";
import { ApolloClient, createNetworkInterface, ApolloProvider } from "react-apollo";

import StopPoster from "components/stopPoster/stopPoster";
import Timetable from "components/timetable/timetableContainer";
import renderQueue from "util/renderQueue";

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
    componentDidMount() {
        renderQueue.onEmpty(({ success }) => {
            if (!success) {
                handleError(new Error("Failed to render component"));
                return;
            }
            window.callPhantom({
                width: this.root.offsetWidth,
                height: this.root.offsetHeight,
            });
        });
    }

    handleError(error) {
        if (window.callPhantom) {
            window.callPhantom({ error: error.message });
            return;
        }
        console.error(error);
    }

    render() {
        let ComponentToRender;
        let props;

        try {
            const params = queryString.parse(location.hash);
            ComponentToRender = components[params.component];
            props = JSON.parse(params.props);
        } catch (error) {
            this.handleError(new Error("Failed to parse url fragment"));
            return null;
        }

        if (!ComponentToRender || !props) {
            this.handleError(new Error("Invalid component or props"));
            return null;
        }

        return (
            <div style={{ display: "inline-block" }} ref={(ref) => { this.root = ref; }}>
                <ApolloProvider client={client}>
                    <ComponentToRender {...props}/>
                </ApolloProvider>
            </div>
        );
    }
}

export default App;
