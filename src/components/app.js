import React, { Component } from "react";
import queryString from "query-string";
import { ApolloClient, createNetworkInterface, ApolloProvider } from "react-apollo";

import StopPoster from "components/stopPoster/stopPosterContainer";
import Timetable from "components/timetable/timetableContainer";
import RouteMap from "components/routeMap/routeMap";

import renderQueue from "util/renderQueue";
import { setMapScale } from "util/map";
import { setQrCodeScale } from "components/qrCode";

const components = {
    StopPoster,
    Timetable,
    RouteMap,
};

const client = new ApolloClient({
    networkInterface: createNetworkInterface({
        uri: "http://kartat.hsl.fi/jore/graphql",
    }),
});

class App extends Component {
    static handleError(error) {
        if (window.callPhantom) {
            window.callPhantom({ error: error.message });
            return;
        }
        console.error(error); // eslint-disable-line no-console
    }

    componentDidMount() {
        if (this.root) {
            renderQueue.onEmpty(({ error }) => {
                if (error) {
                    App.handleError(error);
                    return;
                }
                if (window.callPhantom) {
                    window.callPhantom({
                        width: this.root.offsetWidth * this.scale,
                        height: this.root.offsetHeight * this.scale,
                    });
                }
            });
        }
    }

    render() {
        let ComponentToRender;
        let props;

        try {
            const params = queryString.parse(location.hash);
            ComponentToRender = components[params.component];
            props = JSON.parse(params.props);
            this.scale = params.scale || 1;
            if (this.scale > 1) {
                setMapScale(this.scale);
                setQrCodeScale(this.scale);
            }
        } catch (error) {
            App.handleError(new Error("Failed to parse url fragment"));
            return null;
        }

        if (!ComponentToRender || !props) {
            App.handleError(new Error("Invalid component or props"));
            return null;
        }

        return (
            <div
                style={{
                    display: "inline-block",
                    transform: `scale(${this.scale})`,
                    transformOrigin: "top left",
                }}
                ref={(ref) => { this.root = ref; }}
            >
                <ApolloProvider client={client}>
                    <ComponentToRender {...props}/>
                </ApolloProvider>
            </div>
        );
    }
}

export default App;
