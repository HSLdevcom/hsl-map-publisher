import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const InlineSVG = ({ src, ...otherProps }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !src) return;

    let shadow = containerRef.current.shadowRoot;
    if (!shadow) {
      shadow = containerRef.current.attachShadow({ mode: 'open' });
    }

    shadow.innerHTML = src;
  }, [src]);

  return <div ref={containerRef} {...otherProps} />;
};

InlineSVG.propTypes = {
  src: PropTypes.string.isRequired,
};

export default InlineSVG;
