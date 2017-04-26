import React from "react";
import PropTypes from "prop-types";
import promiseWrapper from "util/promiseWrapper";

const MapImage = props => (
    <img src={props.src}/>
);

MapImage.propTypes = {
    src: PropTypes.string.isRequired,
};

export default promiseWrapper("src")(MapImage);
