import React from 'react';
import PropTypes from 'prop-types';

function MapImage(props) {
  return <img src={props.src} alt="" />;
}

MapImage.propTypes = {
  src: PropTypes.string.isRequired,
};

export default MapImage;
