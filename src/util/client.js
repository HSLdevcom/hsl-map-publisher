import qs from 'qs';

const parseRenderParams = paramsStr => {
  return qs.parse(paramsStr, {
    ignoreQueryPrefix: true,
    decoder: str => {
      // Make booleans booleans again
      // qs encodes booleans to strings, we need to make sure that they are real booleans.
      if (str === 'true') {
        return true;
      }
      if (str === 'false') {
        return false;
      }
      return decodeURIComponent(str);
    },
  });
};

export { parseRenderParams };
