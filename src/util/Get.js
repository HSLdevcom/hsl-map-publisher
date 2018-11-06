import get from 'lodash/get';
import set from 'lodash/set';

export default function Get({
  source,
  path = [],
  paths = path,
  defaultValue,
  defaults = defaultValue,
  children,
}) {
  const pathsArray = Array.isArray(paths) ? paths : [paths];
  const defaultsArray = Array.isArray(defaults) ? defaults : [defaults];

  if (pathsArray.length === 0) {
    return children({});
  }

  const values = pathsArray.reduce((allValues, currentPath, i) => {
    set(
      allValues,
      currentPath,
      get(source, currentPath, get(defaultsArray, `[${i}]`, defaults)),
    );
    return allValues;
  }, {});

  return children(values);
}
