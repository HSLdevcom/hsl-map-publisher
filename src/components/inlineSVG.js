import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const InlineSVG = ({ src, ...otherProps }) => {
  return (
    <div
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: src }}
      {...otherProps}
    />
  );
};

InlineSVG.propTypes = {
  src: PropTypes.string.isRequired,
};

export default InlineSVG;
