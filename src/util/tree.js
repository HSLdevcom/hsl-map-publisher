
/**
 * Returns an index where items differ from items in node
 * @param {Object} node
 * @param {Array} items
 * @param {function} isEqual - Should return true if items are equal
 * @returns {number} - One-based index (i.e. number of common items)
 */
function getCommonItemCount(node, items, isEqual) {
    for (let i = 0; i < node.items.length; i++) {
        if (i === items.length || !isEqual(items[i], node.items[i])) {
            return i;
        }
    }
    return node.items.length;
}

/**
 * Recursively adds given items to nodes and their child nodes
 * @param {Array} nodes
 * @param {Array} items
 */
const addItems = (nodes, items, options) => {
    if (!items || !items.length) {
        return;
    }

    const { isEqual, merge } = options;

    for (const node of nodes) {
        const count = getCommonItemCount(node, items, isEqual);

        if (count) {
            const commonItems = node.items.slice(0, count).map((item, i) => merge(item, items[i]));
            // Remaining items to add to node or children
            const itemsToAdd = items.slice(Math.min(items.length, count));
            // Items to remove from node if adding new items
            const itemsToRemove = node.items.slice(Math.min(node.items.length, count));

            // Node already contains equivalent items
            if (!itemsToAdd.length) {
                node.items = [...commonItems, ...itemsToRemove];
                return;
            }
            // No children, append new items to node
            if (!node.children && !itemsToRemove.length) {
                node.items = [...commonItems, ...itemsToAdd];
                return;
            }

            node.items = commonItems;

            if (itemsToRemove.length) {
                if (!node.children) {
                    node.children = [{ items: itemsToRemove }];
                } else {
                    node.children = [{ items: itemsToRemove, children: node.children }];
                }
            }

            if (itemsToAdd.length) {
                if (!node.children) {
                    node.children = [{ items: itemsToAdd }];
                } else {
                    addItems(node.children, itemsToAdd, options);
                }
            }

            return;
        }
    }

    // No common items found with any node. Add as new node.
    nodes.push({ items });
};

function getWidth(node) {
    if (node.children) {
        return node.children.reduce((prev, cur) => prev + getWidth(cur), 0);
    }
    return 1;
}

function getHeight(node) {
    let height = 0;
    if (node.items) {
        height += node.items.length;
    }
    if (node.children) {
        height += node.children.reduce((prev, cur) => Math.max(getHeight(cur), prev), 0);
    }
    return height;
}

/**
 * Returns lists as a tree
 * @param {Array.<Object[]>} itemLists
 * @param {Object} options
 * @returns {Object}
 */
function itemsToTree(itemLists, options) {
    const nodes = [];

    itemLists.forEach(items => addItems(nodes, items, options));
    const root = (nodes.length > 1) ? { items: [], children: nodes } : nodes[0];

    return root || [];
}

/**
 * Returns lowest (largest amount of preceding items) node with two or more children
 * @param {Object} root - Root node
 * @param {number} initialDepth
 * @returns {Object} - Lowest branch
 */
function findLowestBranch(root, initialDepth = 0) {
    if (!root.children) return null;
    const depth = initialDepth + (root.items ? root.items.length : 0);
    let branchToReturn = { depth, root };
    root.children.forEach((child) => {
        const candidate = findLowestBranch(child, depth);
        if (candidate && candidate.depth > branchToReturn.depth) {
            branchToReturn = candidate;
        }
    });
    return branchToReturn;
}

/**
 * Returns node with the most items from longest path
 * @param {Object} node - Root node
 * @returns {*}
 */
function findLongestPath(root) {
    if (!root.children) {
        return root;
    }

    // Find child node that is part of longest path
    const child = root.children.reduce((prev, cur) => (
        getHeight(cur) > getHeight(prev) ? cur : prev
    ));

    // Find descendant with the most items from longest path
    const node = findLongestPath(child);

    return node.items.length > (root.items ? root.items.length : 0) ? node : root;
}

/**
 * Prunes tree and truncates item lists to fit tree in given dimensions
 * @param {Object} root - Root node
 * @param {Object} options - Options width, height, prune, truncate
 */
function generalizeTree(root, options) {
    const { width, height, prune, truncate } = options;

    while (getWidth(root) > width) {
        prune(findLowestBranch(root).root);
    }
    while (getHeight(root) > height) {
        truncate(findLongestPath(root));
    }
}

/**
 * Sorts nodes by sub tree width
 * @param {Object} root - Root node
 */
function sortBranches(root) {
    if (root.children) {
        const sortValue = node => getWidth(node);
        root.children.sort((a, b) => sortValue(a) - sortValue(b));
        root.children.forEach(node => sortBranches(node));
    }
}

export {
    itemsToTree,
    generalizeTree,
    sortBranches,
};
