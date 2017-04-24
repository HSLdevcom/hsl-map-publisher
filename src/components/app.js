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
        if (window.callPhantom) {
            renderQueue.onEmpty(({ success }) => {
                if (!success) {
                    window.callPhantom({ error: "Failed to render component" });
                    return;
                }
                window.callPhantom({
                    width: this.root.offsetWidth,
                    height: this.root.offsetHeight,
                });
            });
        }
    }

    render() {
        const params = queryString.parse(location.hash);
        const ComponentToRender = components[params.component];
        const props = JSON.parse(params.props);

        if (!ComponentToRender || !props) {
            if (window.callPhantom) window.callPhantom({ error: "Invalid component or props" });
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
