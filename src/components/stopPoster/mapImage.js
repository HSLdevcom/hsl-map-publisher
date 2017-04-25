import React, { PropTypes } from "react";
import promiseWrapper from "util/promiseWrapper";

const MapImage = props => (
    <img src={props.src}/>
);

MapImage.propTypes = {
    src: PropTypes.string.isRequired,
};

export default promiseWrapper("src")(MapImage);
