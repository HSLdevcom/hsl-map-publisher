const uuidv4 = require('uuid/v4');

// Pre-compile regexes outside the function
const MAIN_REGEX = /<style>([\s\S]*?)<\/style>|class="([^"]+)"|(?<!xlink:)id="([^"]+)"|url\(#([^)]+)\)|xlink:href="#([^"]+)"|(?<!xlink:)href="#([^"]+)"/g;
const STYLE_CLASS_REGEX = /(^|[^\w-])\.([a-zA-Z_][\w-]*)(?=\s*[{,])/gm;
const STYLE_ID_REGEX = /(^|[^\w-])#([a-zA-Z_][\w-]*)(?=\s*[{,])/gm;
const STYLE_URL_REGEX = /url\(#([^)]+)\)/g;
const CLASS_ATTR_REGEX = /\S+/g;
const EXISTING_PREFIX_REGEX = /svg-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/g;

/**
 * @param {string} src - The SVG source string
 * @returns {string} The SVG with existing prefixes removed
 */
const stripExistingPrefixes = src => src.replace(EXISTING_PREFIX_REGEX, '');

/**
 * Processes SVG content by adding unique prefixes to class names and IDs
 * to avoid conflicts when multiple SVGs are embedded in the same page.
 *
 * @param {string} src - The SVG source string to process
 * @returns {string} The processed SVG with unique prefixed classes and IDs
 */
const processSVGWithUniqueIds = src => {
  const cleaned = stripExistingPrefixes(src);
  const prefix = `svg-${uuidv4()}`;

  return cleaned.replace(
    MAIN_REGEX,
    (match, styles, classAttr, idAttr, urlId, xlinkHref, hrefAttr) => {
      if (styles) {
        const prefixed = styles
          .replace(STYLE_CLASS_REGEX, `$1.${prefix}-$2`)
          .replace(STYLE_ID_REGEX, `$1#${prefix}-$2`)
          .replace(STYLE_URL_REGEX, `url(#${prefix}-$1)`);
        return `<style>${prefixed}</style>`;
      }
      if (classAttr) {
        // Use replace instead of split/map/join to avoid array allocation
        return `class="${classAttr.replace(CLASS_ATTR_REGEX, c => `${prefix}-${c}`)}"`;
      }
      if (idAttr) return `id="${prefix}-${idAttr}"`;
      if (urlId) return `url(#${prefix}-${urlId})`;
      if (xlinkHref) return `xlink:href="#${prefix}-${xlinkHref}"`;
      if (hrefAttr) return `href="#${prefix}-${hrefAttr}"`;
      return match;
    },
  );
};

module.exports = {
  processSVGWithUniqueIds,
};
