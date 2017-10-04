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
    });
}

const getClient = getContext({
    client: PropTypes.shape({
        query: PropTypes.func.isRequired,
    }).isRequired,
});

const propsMapper = mapProps(({ options, components, date, client: { query }, extraLayers }) => {
    const mapStyle = getMapStyle(components);

    // Fetch routes from GraphQL instead of default vector tiles
    if (components.routes && components.routes.enabled && components.routes.useGraphQL) {
        const src = addRoutesToStyle(options, mapStyle, query, date)
            .then(styleWithRoutes => fetchMap(options, styleWithRoutes));
        return { src };
    }

    // Remove source containing bus routes (rail and subway routes have separate sources)
    if (components.routes && components.routes.enabled && components.routes.hideBusRoutes) {
        mapStyle.sources.routes = {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: [],
            },
        };
    }

    if (extraLayers) {
        mapStyle.layers = [...mapStyle.layers, ...extraLayers];
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
        useGraphQL: PropTypes.bool,
        hideBusRoutes: PropTypes.bool,
    })).isRequired,
    date: PropTypes.string,
    extraLayers: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
    })),
};

export default MapImageContainer;
