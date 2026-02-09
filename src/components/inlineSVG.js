import React, { useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const InlineSVG = ({ src, ...otherProps }) => {
  const svgId = Math.random()
    .toString(36)
    .slice(2, 12);
  const processedSVG = useMemo(() => {
    const prefix = `svg-${svgId}`;

    return src.replace(
      /<style>([\s\S]*?)<\/style>|class="([^"]+)"|id="([^"]+)"/g,
      (match, styles, classAttr, idAttr) => {
        if (styles) {
          return `<style>${styles
            // Class selectors: only match when followed by { or , (selector context)
            .replace(/(^|[^\w-])\.([a-zA-Z_][\w-]*)(?=\s*[{,])/gm, `$1.${prefix}-$2`)
            // ID selectors: only match when followed by { or , (selector context)
            .replace(/(^|[^\w-])#([a-zA-Z_][\w-]*)(?=\s*[{,])/gm, `$1#${prefix}-$2`)}</style>`;
        }
        if (classAttr) {
          return `class="${classAttr
            .split(/\s+/)
            .map(c => `${prefix}-${c}`)
            .join(' ')}"`;
        }
        if (idAttr) {
          return `id="${prefix}-${idAttr}"`;
        }
        return match;
      },
    );
  }, [svgId, src]);

  return <div dangerouslySetInnerHTML={{ __html: processedSVG }} {...otherProps} />;
};

InlineSVG.propTypes = {
  src: PropTypes.string.isRequired,
};

export default InlineSVG;
