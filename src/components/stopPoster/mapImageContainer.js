import PropTypes from "prop-types";

import compose from "recompose/compose";
import mapProps from "recompose/mapProps";
import getContext from "recompose/getContext";

import hslMapStyle from "hsl-map-style";

import { fetchMap } from "util/api";
import promiseWrapper from "util/promiseWrapper";
import { addRoutesToStyle } from "util/routeNetwork";

import MapImage from "./mapImage";

function getMapStyle(components) {
    return hslMapStyle.generateStyle({
        lang: ["fi", "sv"],
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

    if (components.routes && components.routes.enabled) {
        return {
            src: addRoutesToStyle(options, mapStyle, query, date).then(newMapStyle =>
                fetchMap(options, newMapStyle)),
        };
    }
    return { src: fetchMap(options, mapStyle) };
});

export default compose(
    getClient,
    propsMapper,
    promiseWrapper("src")
)(MapImage);
