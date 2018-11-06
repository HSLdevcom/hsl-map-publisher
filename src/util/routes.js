import get from 'lodash/get';
import { itemsToTree, generalizeTree, sortBranches } from 'util/tree';
import { getZoneName } from './domain';

const MAX_WIDTH = 6;
const MAX_HEIGHT = 25;
// The value to divide a pixel height by to reach the unit used for MAX_HEIGHT.
const STOP_PX_HEIGHT = 35;

function isEqual(stop, other) {
  if (stop.type !== other.type) return false;
  if (stop.type === 'zone') {
    return stop.from === other.from && stop.to === other.to;
  }
  return (
    (stop.terminalId !== null && stop.terminalId === other.terminalId) ||
    (stop.nameFi === other.nameFi && stop.nameSe === other.nameSe)
  );
}

function merge(stop, other) {
  const destinations = [
    ...get(stop, 'destinations', []),
    ...get(other, 'destinations', []),
  ];
  return destinations.length > 0 ? { ...stop, destinations } : stop;
}

function prune(branch) {
  const destinations = [...branch.children]
    .reduce((prev, node) => [...prev, ...node.items], [])
    .reduce((prev, stop) => [...prev, ...get(stop, 'destinations', [])], []);

  // eslint-disable-next-line no-param-reassign
  branch.items = [...branch.items, { type: 'gap', destinations }];
  delete branch.children; // eslint-disable-line no-param-reassign
}

function truncate(node) {
  const { items } = node;
  const gap = items.find(item => item.type === 'gap');

  if (gap) {
    const index = items.indexOf(gap);
    const removedNode = items.splice(index + (index > items.length / 2 ? -1 : 1), 1);
    if (get(removedNode, '[0].destinations')) {
      if (!gap.destinations) gap.destinations = [];
      gap.destinations = gap.destinations.concat(removedNode[0].destinations);
    }
  } else {
    const index = items.length - 1;
    const itemToAdd = { type: 'gap' };
    const removedItem = items.splice(index, 1, itemToAdd);
    if (get(removedItem, '[0].destinations')) {
      itemToAdd.destinations = removedItem[0].destinations;
    }
  }
}

/**
 * Returns routes as a tree representing connections from given stop
 * @param {Array} routes
 * @returns {Object}
 */
function routesToTree(routes, shortId, height = 'auto') {
  const currentZone = getZoneName(shortId);

  const itemLists = routes.map(route =>
    route.stops.map((stop, index, stops) => {
      const item = { ...stop, type: 'stop', zone: getZoneName(stop.shortId) };
      if (index === stops.length - 1) {
        item.destinations = [
          {
            routeId: route.routeId,
            titleFi: route.destinationFi,
            titleSe: route.destinationSe,
          },
        ];
      }
      return item;
    }),
  );

  const itemsListWithZoneBorders = itemLists.map(items =>
    items.reduce((prev, item) => {
      if (prev.length === 0 && currentZone !== item.zone) {
        return [{ type: 'zone', from: currentZone, to: item.zone }, item];
      }
      if (
        prev.length > 0 &&
        prev[prev.length - 1].type === 'stop' &&
        prev[prev.length - 1].zone !== item.zone
      ) {
        return [
          ...prev,
          { type: 'zone', from: prev[prev.length - 1].zone, to: item.zone },
          item,
        ];
      }
      return [...prev, item];
    }, []),
  );

  const root = itemsToTree(itemsListWithZoneBorders, { isEqual, merge });

  // height is auto if the generated local map is used. Only if
  // a static image is set will height be a px value, in which case maxHeight
  // needs to be adjusted here to not cause overflow errors.
  const maxHeight =
    height !== 'auto'
      ? // The diagram height is whatever is left over from the map.
        Math.floor(height / STOP_PX_HEIGHT) - 10 // A bit of margin, both for errors and design
      : MAX_HEIGHT;

  generalizeTree(root, {
    width: MAX_WIDTH,
    height: maxHeight,
    prune,
    truncate,
  });

  sortBranches(root);
  return root;
}

export {
  routesToTree, // eslint-disable-line import/prefer-default-export
};
