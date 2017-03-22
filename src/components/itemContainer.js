import React, { Component, PropTypes } from "react";
import styles from "./itemContainer.css";

const MAX_ITERATIONS = 10;
const OVERLAP_COST_FIXED = 5;
const DISTANCE_COST = 10;
const MASK_MARGIN = 5;

const angles = [-90, -40, -30, -20, -10, -5, -1, 1, 5, 10, 20, -30, 40, 90, 180];
const distances = [-20, -5, 5, 20];

const Connector = props => (
    <path
        d={`M${props.x} ${props.y} L${props.x + props.cx} ${props.y + props.cy}`}
        fill="none"
        stroke="#007AC9"
        strokeWidth="2"
    />
);

const Mask = props => (
    <rect
        x={props.left + MASK_MARGIN}
        y={props.top + MASK_MARGIN}
        width={props.width - (MASK_MARGIN * 2)}
        height={props.height - (MASK_MARGIN * 2)}
        fill="#000"
    />
);

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

/**
 * Container for items whose position will be adjusted for minimal overlap
 */
class ItemContainer extends Component {

    static getDistanceCost(positions) {
        let sum = 0;
        positions.forEach((position) => {
            if (position.distance) sum += position.distance - position.initialDistance;
        });
        return sum * DISTANCE_COST;
    }

    static getIntersectionArea(a, b) {
        const width = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
        const height = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
        return Math.max(0, width) * Math.max(0, height);
    }

    static getOverlappingComponents(positions, parentIndex) {
        const matchedIndexes = [];
        positions.forEach((position, index) => {
            if (index !== parentIndex && !positions[index].isFixed &&
                ItemContainer.getIntersectionArea(positions[index], positions[parentIndex]) > 0) {
                matchedIndexes.push(index);
            }
        });
        return matchedIndexes;
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
        if (position.isFixed) {
            return position;
        }

        let distance = "distance" in position ? position.distance : position.initialDistance;
        let angle = "angle" in position ? position.angle : position.initialAngle;

        if (diff.angle) angle = (angle + diff.angle) % 360;
        if (diff.distance) distance += diff.distance;
        if (distance < position.distance) distance = position.distance;

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
            cy
        };
    }

    static getUpdatedPositions(positions, indexToUpdate, diff) {
        return positions.map((position, index) => {
            if (index === indexToUpdate) {
                return ItemContainer.updatePosition(position, diff);
            }
            return position;
        });
    }

    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.updateChildren();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.children !== this.props.children) {
            this.updateChildren();
        }
    }

    getCollisionCost(positions) {
        let overflow = 0;
        let overlap = 0;

        const boundingBox = {
            left: 0,
            top: 0,
            width: this.root.offsetWidth,
            height: this.root.offsetHeight,
        };

        for (let i = 0; i < positions.length; i++) {
            if (!positions[i].isFixed) {
                const rectArea = positions[i].width * positions[i].height;
                overflow += rectArea - ItemContainer.getIntersectionArea(boundingBox, positions[i]);
            }
            for (let j = i + 1; j < positions.length; j++) {
                if (!positions[i].isFixed || !positions[j].isFixed) {
                    const area = ItemContainer.getIntersectionArea(positions[i], positions[j]);
                    const isFixed = positions[i].isFixed || positions[j].isFixed;
                    overlap += isFixed ? area * OVERLAP_COST_FIXED : area;
                }
            }
        }
        return overlap + overflow;
    }

    getPlacement(positions) {
        const collision = this.getCollisionCost(positions);
        const distance = ItemContainer.getDistanceCost(positions);
        const cost = collision + distance;
        return { positions, cost };
    }

    getPlacements(positions, indexToMove) {
        const diffs = angles.reduce(
            (prev, angle) => ([...prev, ...distances.map(distance => ({ angle, distance }))]),
        []);
        return diffs.map((diff) => {
            const updatedPositions = positions.map((position, index) => (
                index === indexToMove ? ItemContainer.updatePosition(position, diff) : position
            ));
            return this.getPlacement(updatedPositions);
        });
    }

    getPlacementsForOverlapping(placements, indexToOverlap) {
        return placements
            .map(({ positions }) => (
                ItemContainer
                    .getOverlappingComponents(positions, indexToOverlap)
                    .map(index => this.getPlacements(positions, index))
                    .reduce((prev, cur) => [...prev, ...cur], [])
            )).reduce((prev, cur) => [...prev, ...cur], []);
    }

    updateChildren() {
        // Get refs to mounted children
        const refs = this.childRefs.filter(ref => !!ref);

        // Calculate initial positions and collisions
        const initialPositions = refs
            .map(ref => ref.getPosition())
            .map(position => ItemContainer.updatePosition(position));
        let placement = this.getPlacement(initialPositions);

        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
            if (placement.cost <= 0) break;

            placement.positions.forEach((position, index, positions) => { // eslint-disable-line
                if (position.isFixed) return;

                // Get potential positions for component at index
                const placements = this.getPlacements(positions, index);

                // Get potential positions for components overlapping component at index
                const placementForOverlapping = this.getPlacementsForOverlapping(placements, index);

                const nextPlacement = [
                    ...placements,
                    ...placementForOverlapping,
                ].reduce((prev, cur) => (cur.cost < prev.cost ? cur : prev));

                if (nextPlacement.cost < placement.cost) {
                    placement = nextPlacement;
                }
            });
        }

        refs.forEach((ref, index) => {
            ref.setPosition(placement.positions[index].top, placement.positions[index].left);
        });

        this.setState({ positions: placement.positions });
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
