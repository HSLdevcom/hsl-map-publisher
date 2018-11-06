/* eslint-disable no-restricted-globals */

import optimizePositions from './optimizePositions';

self.addEventListener('message', event => {
  const { positions, boundingBox } = event.data;
  const optimizedPositions = optimizePositions(positions, boundingBox);
  self.postMessage(optimizedPositions);
});
