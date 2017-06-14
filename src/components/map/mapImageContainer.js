import PropTypes from "prop-types";

import compose from "recompose/compose";
import mapProps from "recompose/mapProps";
import getContext from "recompose/getContext";

import hslMapStyle from "hsl-map-style";

import { fetchMap } from "util/map";
import promiseWrapper from "util/promiseWrapper";
import { addRoutesToStyle } from "util/routeNetwork";

import MapImage from "./mapImage";

function getMapStyle(components) {
    return hslMapStyle.generateStyle({
        components,
        glyphsUrl: "http://kartat.hsl.fi/",
        sourcesUrl: "api.digitransit.fi/map/v1/",
    });
}

const getClient = getContext({
    client: PropTypes.shape({
        query: PropTypes.func.isRequired,
    }).isRequired,
});

const propsMapper = mapProps(({ options, components, date, client: { query } }) => {
    const mapStyle = getMapStyle(components);

    if (components.routes && components.routes.enabled && components.routes.fetchRoutes) {
        const src = addRoutesToStyle(options, mapStyle, query, date)
            .then(styleWithRoutes => fetchMap(options, styleWithRoutes));
        return { src };
    }

    if (components.routes && components.routes.enabled && components.routes.removeSource) {
        mapStyle.sources.routes = {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: [],
            },
        };
    }
    return { src: fetchMap(options, mapStyle) };
});

const hoc = compose(
    getClient,
    propsMapper,
    promiseWrapper("src")
);

const MapImageContainer = hoc(MapImage);

MapImageContainer.defaultProps = {
    // Used only when routes component is enabled
    date: new Date().toISOString().substring(0, 10),
};

MapImageContainer.propTypes = {
    options: PropTypes.shape({
        center: PropTypes.arrayOf(PropTypes.number).isRequired,
        zoom: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        scale: PropTypes.number,
    }).isRequired,
    components: PropTypes.objectOf(PropTypes.shape({
        enabled: PropTypes.bool.isRequired,
        fetchRoutes: PropTypes.bool,
        removeSource: PropTypes.bool,
    })).isRequired,
    date: PropTypes.string,
};

export default MapImageContainer;
