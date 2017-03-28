import React, { Component, PropTypes } from "react";
import segseg from "segseg";
import memoize from "util/memoize";

import styles from "./itemContainer.css";

const MAX_ITERATIONS = 40;
const OVERLAP_COST_FIXED = 5;
const INTERSECTION_COST = 50;
const DISTANCE_COST = 1;

const MASK_MARGIN = 5;

const ANGLES = [-32, -16, -8, -4, -1, 0, 1, 4, 8, 16, 32];
const DISTANCES = [-25, -10, -1, 0, 1, 10, 25];
const FACTORS = [5, 3, 2, 1];

const diffs = FACTORS.map(f => (
    ANGLES.reduce((prev, angle) => (
        [...prev, ...DISTANCES.map(distance => ({ angle: angle * f, distance: distance * f }))]
    ), [])
));

const Connector = props => (
    <path
        d={`M${props.x} ${props.y} L${props.x + props.cx} ${props.y + props.cy}`}
        fill="none"
        stroke="#007AC9"
        strokeWidth="2"
    />
);

Connector.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    cx: PropTypes.number.isRequired,
    cy: PropTypes.number.isRequired,
};

const Mask = props => (
    <rect
        x={props.left + MASK_MARGIN}
        y={props.top + MASK_MARGIN}
        width={props.width - (MASK_MARGIN * 2)}
        height={props.height - (MASK_MARGIN * 2)}
        fill="#000"
    />
);

Mask.propTypes = {
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
};

const Overlays = props => (
    <svg width={props.width} height={props.height}>
        <defs>
            <mask id="label-mask" x="0" y="0" width="1" height="1">
                <rect width={props.width} height={props.height} fill="#fff"/>
                {props.positions.map((position, index) => (
                    !position.isFixed ? <Mask key={index} {...position}/> : null
                ))}
            </mask>
        </defs>
        <g mask="url(#label-mask)">
            {props.positions.map((position, index) => (
                !position.isFixed ? <Connector key={index} {...position}/> : null
            ))}
        </g>
    </svg>
);

Overlays.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    positions: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.shape({
            top: PropTypes.number.isRequired,
            left: PropTypes.number.isRequired,
            width: PropTypes.number.isRequired,
            height: PropTypes.number.isRequired,
        }),
        PropTypes.shape({
            ...Connector.propTypes,
            ...Mask.propTypes,
        }),
    ])).isRequired,
};

/**
 * Container for items whose position will be adjusted for minimal overlap
 */
class ItemContainer extends Component {

    /**
     * Returns intersection area of two components
     * @param {Object} a
     * @param {Object} b
     * @returns {number}
     */
    static getIntersectionArea(a, b) {
        const width = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
        const height = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
        return Math.max(0, width) * Math.max(0, height);
    }

    /**
     * Returns true if connecting lines of components a and b intersect
     * @param {Object} a
     * @param {Object} b
     * @param {boolean}
     */
    static hasIntersectingLines(a, b) {
        return segseg(a.x, a.y, a.cx, a.cy, b.x, b.y, b.cx, b.cy);
    }

    /**
     * Returns cost for increased distances from anchor
     * @param {Object[]} positions - Positions
     * @param {number[]} indexes - Indexes to check
     * @returns {number}
     */
    static getDistanceCost(positions, indexes) {
        return DISTANCE_COST * indexes.reduce((prev, index) =>
            prev + (positions[index].distance - positions[index].initialDistance), 0);
    }

    /**
     * Returns updated position for component
     * @param {Object} position
     * @param {Object} diff - Changes to position (Optional; only update left and right values)
     * @param {number} diff.angles - Degrees to rotate
     * @param {number} diff.distance - Pixels to add to distance from anchor x, y
     * @returns {Object} - Updated position
     */
    static updatePosition(position, diff = {}) {
        if (position.isFixed) return position;

        let distance = "distance" in position ? position.distance : position.initialDistance;
        let angle = "angle" in position ? position.angle : position.initialAngle;

        if (diff.angle) angle = (angle + diff.angle) % 360;
        if (diff.distance) distance += diff.distance;

        if (distance < position.initialDistance) return null;

        const a = position.width / 2;
        const b = position.height / 2;
        const cos = Math.cos((angle * Math.PI) / 180);
        const sin = Math.sin((angle * Math.PI) / 180);

        let radius = Math.min(a, b) + distance;
        let cx;
        let cy;
        let dx;
        let dy;

        do {
            cx = radius * cos;
            cy = radius * sin;
            dx = Math.max(Math.abs(cx) - a, 0);
            dy = Math.max(Math.abs(cy) - b, 0);
            radius += 1;
        } while (Math.sqrt((dx * dx) + (dy * dy)) < distance);

        return {
            ...position,
            left: Math.round((position.x + cx) - (position.width / 2)),
            top: Math.round((position.y + cy) - (position.height / 2)),
            distance,
            angle,
            cx,
            cy,
        };
    }

    constructor(props) {
        super(props);
        this.state = {};
        this.getIntersectionArea = memoize(ItemContainer.getIntersectionArea, 2);
        this.hasIntersectingLines = memoize(ItemContainer.hasIntersectingLines, 2);
        this.updatePosition = memoize(ItemContainer.updatePosition, 2);
    }

    componentDidMount() {
        this.updateBoundingBox();
        this.updateChildren();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.children !== this.props.children) {
            this.updateBoundingBox();
            this.updateChildren();
        }
    }

    getOverlappingComponent(positions, indexToOverlap) {
        for (let i = 0; i < positions.length; i++) {
            if (i !== indexToOverlap && !positions[i].isFixed &&
                this.getIntersectionArea(positions[i], positions[indexToOverlap]) > 0) {
                return i;
            }
        }
        return null;
    }

    /**
     * Returns cost for intersecting connector lines from anchor to label
     * @param {Object[]} positions - Positions
     * @param {number[]} indexes - Indexes to check
     * @returns {number}
     */
    getIntersectionCost(positions, indexes) {
        let sum = 0;
        indexes.forEach((i) => {
            const a = positions[i];
            indexes.forEach((j) => {
                if (j <= i) return;
                const b = positions[j];
                if (this.hasIntersectingLines(a, b)) sum += 1;
            });
        });
        return sum * INTERSECTION_COST;
    }

    /**
     * Returns cost for overlapping non-fixed components
     * @param {Object[]} positions - Positions
     * @param {number[]} indexes - Indexes to check
     * @returns {number}
     */
    getOverlapCost(positions, indexes) {
        let overlap = 0;
        indexes.forEach((i) => {
            for (let j = 0; j < positions.length; j++) {
                if (!indexes.includes(j) || j > i) {
                    const area = this.getIntersectionArea(positions[i], positions[j]);
                    const isFixed = positions[i].isFixed || positions[j].isFixed;
                    overlap += (isFixed ? area * OVERLAP_COST_FIXED : area);
                }
            }
        });
        return overlap;
    }

    getCost(positions, indexes) {
        const overlap = this.getOverlapCost(positions, indexes);
        const intersections = this.getIntersectionCost(positions, indexes);
        const distances = ItemContainer.getDistanceCost(positions, indexes);
        return overlap + distances + intersections;
    }

    shouldUpdateOverlapping(placements) {
        for (const placement of placements) {
            if (this.getCost(placement.positions, placement.indexes) < 1) {
                return false;
            }
        }
        return true;
    }

    getPlacements(positions, indexToUpdate, updatedIndexes = []) {
        const indexes = [...updatedIndexes, indexToUpdate];
        return this.diffs
            .map((diff) => {
                const updatedPosition = this.updatePosition(positions[indexToUpdate], diff);
                if (!updatedPosition || this.hasOverflow(updatedPosition)) return null;
                return positions.map(
                    (position, index) => ((index === indexToUpdate) ? updatedPosition : position)
                );
            })
            .filter(value => !!value)
            .map(value => ({ positions: value, indexes }));
    }

    getPlacementsForOverlapping(placements, indexToOverlap) {
        if (!this.shouldUpdateOverlapping(placements)) return [];

        return placements.reduce((prev, { positions, indexes }) => {
            const index = this.getOverlappingComponent(positions, indexToOverlap);
            if (!index) return prev;
            return [...prev, ...this.getPlacements(positions, index, indexes)];
        }, []);
    }

    comparePlacements(placement, other) {
        // Initial placement, always return other
        if (!placement.indexes) return other;

        const indexes = [...new Set([...placement.indexes, ...other.indexes])];
        const cost = this.getCost(placement.positions, indexes);
        const costOther = this.getCost(other.positions, indexes);

        return costOther < cost ? other : placement;
    }

    hasOverflow(position) {
        const rectArea = position.width * position.height;
        const overflow = rectArea - this.getIntersectionArea(this.boundingBox, position);
        return overflow > 0;
    }

    updateBoundingBox() {
        this.boundingBox = {
            left: 0,
            top: 0,
            width: this.root.offsetWidth,
            height: this.root.offsetHeight,
        };
    }

    updateDiffs(iteration) {
        this.diffs = diffs[Math.round((diffs.length - 1) * (iteration / MAX_ITERATIONS))];
    }

    updateChildren() {
        // Get refs to mounted children
        const refs = this.childRefs.filter(ref => !!ref);

        // Calculate initial positions and collisions
        const initialPositions = refs
            .map(ref => ref.getPosition())
            .map(position => this.updatePosition(position));
        let placement = { positions: initialPositions };

        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
            const previousPlacement = placement;
            this.updateDiffs(iteration);

            placement.positions.forEach((position, index, positions) => { // eslint-disable-line
                if (position.isFixed) return;

                // Get potential positions for component at index
                const placements = this.getPlacements(positions, index);

                // Get potential positions for components overlapping component at index
                const placementForOverlapping = this.getPlacementsForOverlapping(placements, index);

                placement = [
                    placement,
                    ...placements,
                    ...placementForOverlapping,
                ].reduce((prev, cur) => this.comparePlacements(prev, cur));
            });

            if (placement === previousPlacement) break;
        }

        refs.forEach((ref, index) => {
            ref.setPosition(placement.positions[index].top, placement.positions[index].left);
        });

        this.setState({ positions: placement.positions });

        this.getIntersectionArea.cache.clear();
        this.hasIntersectingLines.cache.clear();
        this.updatePosition.cache.clear();
    }

    render() {
        this.childRefs = [];
        const children = React.Children.map(this.props.children, (child, index) => {
            const props = { ref: (ref) => { this.childRefs[index] = ref; } };
            return child ? React.cloneElement(child, props) : null;
        });
        return (
            <div className={styles.root} ref={(ref) => { this.root = ref; }}>
                {this.state.positions && <Overlays
                    width={this.root.offsetWidth}
                    height={this.root.offsetHeight}
                    positions={this.state.positions}
                />}
                {children}
            </div>
        );
    }
}

ItemContainer.propTypes = {
    children: PropTypes.node.isRequired, // ItemWrapper components
};

export default ItemContainer;
