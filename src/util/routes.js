import { itemsToTree, generalizeTree, sortBranches } from "util/tree";
import { getZoneName } from "./domain";

const MAX_WIDTH = 6;
const MAX_HEIGHT = 25;

function isEqual(stop, other) {
    if (stop.type !== other.type) return false;
    if (stop.type === "zone") {
        return (stop.from === other.from && stop.to === other.to);
    }
    return ((stop.terminalId !== null) &&
           (stop.terminalId === other.terminalId)) ||
           ((stop.nameFi === other.nameFi) &&
           (stop.nameSe === other.nameSe));
}

function merge(stop, other) {
    const destinations = [...(stop.destinations || []), ...(other.destinations || [])];
    return (destinations.length > 0) ? { ...stop, destinations } : stop;
}

function prune(branch) {
    const destinations = [...branch.children]
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
        if (removedNode[0].destinations) {
            if (!gap.destinations) gap.destinations = [];
            gap.destinations.push(removedNode[0].destinations);
        }
    } else {
        const index = items.length - 1;
        const itemToAdd = { type: "gap" };
        const removedItem = items.splice(index, 1, itemToAdd);
        if (removedItem[0].destinations) {
            itemToAdd.destinations = removedItem[0].destinations;
        }
    }
}

/**
 * Returns routes as a tree representing connections from given stop
 * @param {Array} routes
 * @returns {Object}
 */
function routesToTree(routes, shortId) {
    const currentZone = getZoneName(shortId);

    const itemLists = routes.map(route => (
        route.stops.map((stop, index, stops) => {
            const item = { ...stop, type: "stop", zone: getZoneName(stop.shortId) };
            if (index === stops.length - 1) {
                item.destinations = [{
                    routeId: route.routeId,
                    title: route.destinationFi,
                    subtitle: route.destinationSe,
                }];
            }
            return item;
        })
    ));

    const itemsListWithZoneBorders = itemLists.map(items => items.reduce((prev, item) => {
        if (prev.length === 0
            && currentZone !== item.zone
        ) {
            return [
               { type: "zone", from: currentZone, to: item.zone },
                item,
            ];
        } else if (prev.length > 0
            && prev[prev.length - 1].type === "stop"
            && prev[prev.length - 1].zone !== item.zone
        ) {
            return [
                ...prev,
                 { type: "zone", from: prev[prev.length - 1].zone, to: item.zone },
                item,
            ];
        }
        return [...prev, item];
    }, []));

    const root = itemsToTree(itemsListWithZoneBorders, { isEqual, merge });
    generalizeTree(root, { width: MAX_WIDTH, height: MAX_HEIGHT, prune, truncate });
    sortBranches(root);
    return root;
}

export {
    routesToTree, // eslint-disable-line import/prefer-default-export
};
