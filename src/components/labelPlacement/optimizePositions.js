import updatePosition from "./updatePosition";

import {
    hasOverflow,
    getOverflowCost,
    getOverlapArea,
    getOverlapCost,
    getDistanceCost,
    getIntersectionCost,
    getAngleCost,
} from "./costFunctions";


const timeout = 3 * 60 * 1000;
const iterationsPerFactor = 10;

const angles = [-32, -16, -8, -4, -1, 0, 1, 4, 8, 16, 32];
const distances = [-25, -10, -1, 0, 1, 10, 25];
const factors = [5, 3, 2, 1];

const diffsArray = factors.map(factor => (
    angles.reduce((prev, angle) => ([
        ...prev,
        ...distances.map(distance => ({ angle: angle * factor, distance: distance * factor })),
    ]), [])
));

function getCost(placement, bbox) {
    const { positions, indexes } = placement;
    const overflow = getOverflowCost(positions, indexes, bbox);
    const overlap = getOverlapCost(positions, indexes);
    const distance = getDistanceCost(positions, indexes);
    const angle = getAngleCost(positions, indexes);
    const intersection = getIntersectionCost(positions, indexes);
    return overflow + overlap + distance + angle + intersection;
}

function getOverlappingItem(placement, indexToOverlap) {
    const { positions } = placement;
    for (let i = 0; i < positions.length; i++) {
        if (i !== indexToOverlap && !positions[i].isFixed &&
            getOverlapArea(positions[i], positions[indexToOverlap]) > 0) {
            return i;
        }
    }
    return null;
}

function getPlacements(placement, index, diffs, bbox) {
    const { positions, indexes } = placement;

    return diffs
        .map((diff) => {
            const updatedPosition = updatePosition(positions[index], diff);
            if (!updatedPosition || hasOverflow(updatedPosition, bbox)) {
                return null;
            }
            return positions.map((position, i) => ((i === index) ? updatedPosition : position));
        })
        .filter(updatedPositions => !!updatedPositions)
        .map(updatedPositions => ({ positions: updatedPositions, indexes: [...indexes, index] }));
}

function comparePlacements(placement, other, bbox) {
    const indexes = [...new Set([...placement.indexes, ...other.indexes])];
    const cost = getCost({ ...placement, indexes }, bbox);
    const costOther = getCost({ ...other, indexes }, bbox);

    return costOther < cost ? other : placement;
}

function getNextPlacement(initialPlacement, index, diffs, bbox) {
    return new Promise((resolve) => {
        // Get potential positions for item at index
        const placements = getPlacements({ ...initialPlacement, indexes: [] }, index, diffs, bbox);

        // Get positions where one overlapping item is updated as well
        const placementsOverlapping = placements.reduce((prev, placement) => {
            const overlapIndex = getOverlappingItem(placement, index);
            if (!overlapIndex) return prev;
            return [...prev, ...getPlacements(placement, overlapIndex, diffs, bbox)];
        }, []);

        const nextPlacement = [
            initialPlacement,
            ...placements,
            ...placementsOverlapping,
        ].reduce((prev, cur) => comparePlacements(prev, cur, bbox));

        setTimeout(() => resolve(nextPlacement));
    });
}

async function optimizePositions(initialPositions, bbox, ctx = {}) {
    const start = Date.now();

    let placement = {
        positions: initialPositions.map(position => updatePosition(position)),
        indexes: [],
    };

    for (let factor = 0; factor < factors.length; factor++) {
        const diffs = diffsArray[factor];
        for (let iteration = 0; iteration < iterationsPerFactor; iteration++) {
            const previous = placement;
            for (let index = 0; index < placement.positions.length; index++) {
                if (!placement.positions[index].isFixed) {
                    // eslint-disable-next-line no-await-in-loop
                    placement = await getNextPlacement(placement, index, diffs, bbox);
                }
                if (ctx.shouldCancel) {
                    return null;
                }
                if ((Date.now() - start) > timeout) {
                    return placement.positions;
                }
            }
            if (placement === previous) {
                break;
            }
        }
    }

    return placement.positions;
}

export default optimizePositions;
