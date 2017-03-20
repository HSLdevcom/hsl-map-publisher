import { itemsToTree, generalizeTree, sortBranches } from "util/tree";

const MAX_WIDTH = 6;
const MAX_HEIGHT = 20;

function isEqual(stop, other) {
    return (stop.name_fi === other.name_fi) &&
           (stop.name_se === other.name_se);
}

function merge(stop, other) {
    const destinations = [...(stop.destinations || []), ...(other.destinations || [])];
    return (destinations.length > 0) ? { ...stop, destinations } : stop;
}

function prune(branch) {
    const destinations = [...branch.children, branch]
        .reduce((prev, node) => [...prev, ...node.items], [])
        .reduce((prev, stop) => [...prev, ...(stop.destinations || [])], []);

    branch.items = [  // eslint-disable-line no-param-reassign
        ...branch.items,
        { type: "gap", destinations },
    ];
    delete branch.children; // eslint-disable-line no-param-reassign
}

function truncate(node) {
    const { items } = node;
    const gap = items.find(item => item.type === "gap");

    if (gap) {
        const index = items.indexOf(gap);
        const removedNode = items.splice(index + ((index > items.length / 2) ? -1 : 1), 1);
        if (removedNode.destinations) {
            if (!gap.destinations) gap.destinations = [];
            gap.destinations.push(removedNode.destinations);
        }
    } else {
        const index = Math.floor(items.length / 2);
        const itemToAdd = { type: "gap" };
        const removedItem = items.splice(index, 1, itemToAdd);
        if (removedItem.destinations) {
            itemToAdd.destinations = removedItem.destinations;
        }
    }
}

/**
 * Returns routes as a tree representing connections from given stop
 * @param {Object} rootStop
 * @param {Array} routes
 * @returns {Object}
 */
function routesToTree(rootStop, routes) {
    // Get stops after given stop
    const itemLists = routes.map((route) => {
        const rootIndex = route.stops.map(({ stopId }) => stopId).indexOf(rootStop.stopId);

        return route.stops.slice(rootIndex).map((stop, index, stops) => {
            const item = { ...stop, type: "stop" };
            if (index === stops.length - 1) {
                item.destinations = [{ id: route.routeId, title: route.destination_fi }];
            }
            return item;
        });
    });

    const root = itemsToTree(itemLists, { isEqual, merge });
    generalizeTree(root, { width: MAX_WIDTH, height: MAX_HEIGHT, prune, truncate });
    sortBranches(root);
    return root;
}

export {
    routesToTree, // eslint-disable-line import/prefer-default-export
};
