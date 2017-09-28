import PropTypes from "prop-types";
import compose from "recompose/compose";
import mapProps from "recompose/mapProps";

import promiseWrapper from "util/promiseWrapper";

import RouteMap from "./routeMap";

const propsMapper = mapProps(props => ({
    ...props,
    tileset: fetch(props.tileset).then(response => response.json()),
}));

const hoc = compose(
    propsMapper,
    promiseWrapper("tileset")
);

const RouteMapContainer = hoc(RouteMap);

RouteMapContainer.propTypes = {
    ...RouteMap.propTypes,
    tileset: PropTypes.string.isRequired,
};

export default RouteMapContainer;
