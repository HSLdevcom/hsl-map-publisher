import segseg from "segseg";

const OVERLAP_COST = 1;
const OVERLAP_COST_FIXED = 5;
const OVERFLOW_COST = 500000;
const INTERSECTION_COST = 5000;
const INTERSECTION_WITH_FIXED_COST = 25;
const DISTANCE_COST = 2.5;
const ANGLE_COST = 1;

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
    positions.forEach((position, i) => {
        indexes.forEach((j) => {
            if (j >= i && indexes.includes(i)) return;
            const area = getOverlapArea(positions[i], positions[j]);
            const isFixed = positions[i].isFixed || positions[j].isFixed;
            overlap += area * (isFixed ? OVERLAP_COST_FIXED : OVERLAP_COST);
        });
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
            if (positions[j].isFixed) return;
            if (j >= i && indexes.includes(i)) return;
            if (hasIntersectingLines(position, positions[j])) sum += 1;
        });
    });
    return sum * INTERSECTION_COST;
}

function getFixedIntersectionCost(positions, indexes) {
    let sum = 0;
    positions.forEach((position, i) => {
        indexes.forEach((j) => {
            if (j >= i && indexes.includes(i)) return;
            // If both are dynamic or fixed, return
            if (position.isFixed === positions[j].isFixed) return;
            const a = !position.isFixed ? position : positions[j];
            const b = position.isFixed ? position : positions[j];

            const a0 = [a.x, a.y];
            const a1 = [a.x + a.cx, a.y + a.cy];

            const tl = [b.left, b.top];
            const tr = [b.left + b.width, b.top];
            const bl = [b.left, b.top + b.height];
            const br = [b.left + b.width, b.top + b.height];

            const p1 = segseg(a0, a1, tl, tr);
            const p2 = segseg(a0, a1, tl, bl);
            const p3 = segseg(a0, a1, bl, br);
            const p4 = segseg(a0, a1, tr, br);

            const intersections = ([p1, p2, p3, p4]).filter(p => Array.isArray(p));

            if (intersections.length === 2) {
                const dx = intersections[0][0] - intersections[1][0];
                const dy = intersections[0][1] - intersections[1][1];

                sum += Math.sqrt((dx ** 2) + (dy ** 2));
            }
        });
    });
    return sum * INTERSECTION_WITH_FIXED_COST;
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
        return prev + ((phi > 180) ? 360 - phi : phi);
    }, 0);
}

export {
    hasOverflow,
    getOverflowCost,
    getOverlapArea,
    getOverlapCost,
    hasIntersectingLines,
    getIntersectionCost,
    getFixedIntersectionCost,
    getDistanceCost,
    getAngleCost,
};
