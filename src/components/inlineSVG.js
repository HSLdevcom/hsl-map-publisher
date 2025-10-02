import React from 'react';
import PropTypes from 'prop-types';

const getIframeStyle = (src, fitToSize) => {
  let style = { border: 'none', height: '100%', width: '100%' };

  if (!fitToSize) return style;

  const parser = new DOMParser();
  const doc = parser.parseFromString(src, 'image/svg+xml');
  const svg = doc.querySelector('svg');

  if (!svg) return style;

  const width = svg.getAttribute('width') || (svg.viewBox?.baseVal?.width ?? null);
  const height = svg.getAttribute('height') || (svg.viewBox?.baseVal?.height ?? null);

  if (!width || !height) return style;

  style = { ...style, width: `${width}px`, height: `${height}px` };
  return style;
};

const InlineSVG = ({ src, fitToSize = false, ...otherProps }) => {
  const iframeStyle = getIframeStyle(src, fitToSize);
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
  fitToSize: PropTypes.bool,
};

InlineSVG.defaultProps = {
  fitToSize: false,
};

export default InlineSVG;
