import React from "react";
import PropTypes from "prop-types";

const MapImage = props => (
    <img src={props.src}/>
);

MapImage.propTypes = {
    src: PropTypes.string.isRequired,
};

export default MapImage;
