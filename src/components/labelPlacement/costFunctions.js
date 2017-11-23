import segseg from "segseg";

const OVERLAP_COST_FIXED = 5;
const OVERFLOW_COST = 500000;
const INTERSECTION_COST = 5000;
const DISTANCE_COST = 1;
const ANGLE_COST = 0.5;


function hasOverflow(position, boundingBox) {
    return position.left < 0 || position.top < 0 ||
          (position.left + position.width) > boundingBox.width ||
          (position.top + position.height) > boundingBox.height;
}

function getOverflowCost(positions, indexes, boundingBox) {
    return OVERFLOW_COST * indexes.reduce((prev, index) =>
        (hasOverflow(positions[index], boundingBox) ? (prev + 1) : prev), 0);
}

/**
 * Returns intersection area of two items
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
function getOverlapArea(a, b) {
    const width = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
    const height = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
    return Math.max(0, width) * Math.max(0, height);
}

/**
 * Returns cost for overlapping non-fixed items
 * @param {Object[]} positions - Positions
 * @param {number[]} indexes - Indexes to check
 * @returns {number}
 */
function getOverlapCost(positions, indexes) {
    let overlap = 0;
    indexes.forEach((i) => {
        for (let j = 0; j < positions.length; j++) {
            if (!indexes.includes(j) || j > i) {
                const area = getOverlapArea(positions[i], positions[j]);
                const isFixed = positions[i].isFixed || positions[j].isFixed;
                overlap += (isFixed ? area * OVERLAP_COST_FIXED : area);
            }
        }
    });
    return overlap;
}

/**
 * Returns true if line of items a and b intersect
 * @param {Object} a
 * @param {Object} b
 * @param {boolean}
 */
function hasIntersectingLines(a, b) {
    return !!segseg(a.x, a.y, a.x + a.cx, a.y + a.cy, b.x, b.y, b.x + b.cx, b.y + b.cy);
}

/**
 * Returns cost for intersecting lines from anchor to item
 * @param {Object[]} positions - Positions
 * @param {number[]} indexes - Indexes to check
 * @returns {number}
 */
function getIntersectionCost(positions, indexes) {
    let sum = 0;
    positions.forEach((position, i) => {
        if (position.isFixed) return;
        indexes.forEach((j) => {
            if (j <= i) return;
            if (positions[j].isFixed) return;
            if (hasIntersectingLines(position, positions[j])) sum += 1;
        });
    });
    return sum * INTERSECTION_COST;
}

/**
 * Returns cost for increased distances from anchor
 * @param {Object[]} positions - Positions
 * @param {number[]} indexes - Indexes to check
 * @returns {number}
 */
function getDistanceCost(positions, indexes) {
    return DISTANCE_COST * indexes.reduce((prev, index) =>
        prev + (positions[index].distance - positions[index].initialDistance), 0);
}

/**
 * Returns cost for increased angle compared to initial angle
 * @param {Object[]} positions - Positions
 * @param {number[]} indexes - Indexes to check
 * @returns {number}
 */
function getAngleCost(positions, indexes) {
    return ANGLE_COST * indexes.reduce((prev, index) => {
        const phi = Math.abs(positions[index].angle - positions[index].initialAngle) % 360;
        return prev + phi > 180 ? 360 - phi : phi;
    }, 0);
}

export {
    hasOverflow,
    getOverflowCost,
    getOverlapArea,
    getOverlapCost,
    hasIntersectingLines,
    getIntersectionCost,
    getDistanceCost,
    getAngleCost,
};
