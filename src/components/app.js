import React, { Component } from "react";
import queryString from "query-string";

import StopPoster from "components/stopPoster/stopPoster.js";
import { fetchStop, fetchRoutes, fetchMap } from "util/api";

function createOverlaySources(stop) {
    return {
        location: {
            type: "geojson",
            data: {
                type: "Feature",
                geometry: {
                type: "Point",
                    "coordinates": [stop.lat, stop.lon]
                },
                properties: {
                    "title": stop.address_fi,
                    "marker-symbol": "monument"
                }
            }
        }
    }
}

function createOverlayLayers(stop) {
    return [
        {
            id: "location",
            type: "circle",
            source: "location",
            paint: {
                "circle-color": "rgb(219, 27, 84)",
                "circle-radius": 40
            }
        }
    ]
}

function fetchStopPosterData(id) {
    return Promise.all([fetchStop(id), fetchRoutes(id)])
        .then(([stop, routes]) => {
            const mapOptions = {
                center: [stop.lat, stop.lon],
                width: 1000,
                height: 1000,
                zoom: 15,
                sources: createOverlaySources(stop),
                layers: createOverlayLayers(stop),
            };
            const miniMapOptions = {
                center: [stop.lat, stop.lon],
                width: 300,
                height: 300,
                zoom: 9,
                sources: createOverlaySources(stop),
                layers: createOverlayLayers(stop),
            };
            return Promise.all([fetchMap(mapOptions), fetchMap(miniMapOptions)])
                .then(([mapImage, miniMapImage]) => ({ stop, routes, mapImage, miniMapImage }));
        });
}

/**
 * Fetches data from API and dispatches an event to set corresponding view
 * @param {Number} id - Stop identifier
 */
window.setView = (id) => {
    fetchStopPosterData(id).then((data) => {
        const event = new CustomEvent("app:update", { detail: { data } });
        window.dispatchEvent(event);
    }).catch((error) => {
        setTimeout(() => {
            console.error(error); // eslint-disable-line no-console
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
