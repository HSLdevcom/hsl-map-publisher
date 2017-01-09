import React, { Component } from "react";
import styles from "./itemContainer.css";

const MAX_ITERATIONS = 1000;

class ItemContainer extends Component {

    static getIntersectionArea(a, b) {
        const width = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
        const height = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
        return Math.max(0, width) * Math.max(0, height);
    }

    static getCollisionCount(width, height, positions) {
        const boundingBox = { left: 0, top: 0, width, height };
        let overflow = 0;
        let overlap = 0;
        for (let i = 0; i < positions.length; i++) {
            if (!positions[i].isFixed) {
                const rectArea = positions[i].width * positions[i].height;
                overflow += rectArea - ItemContainer.getIntersectionArea(boundingBox, positions[i]);
            }
            for (let j = i + 1; j < positions.length; j++) {
                if (!positions[i].isFixed || !positions[j].isFixed) {
                    overlap += ItemContainer.getIntersectionArea(positions[i], positions[j]);
                }
            }
        }
        return overlap + overflow;
    }

    static getUpdatedPositions(positions, indexToUpdate, angleDiff) {
        return positions.map((position, index) => {
            if (index === indexToUpdate) {
                return ItemContainer.updatePosition(position, angleDiff);
            }
            return position;
        });
    }

    static updatePosition(position, angleDiff = 0) {
        let angle = (position.angle + angleDiff) % 360;
        if (angle < 0) angle = 360 + angle;

        const a = (position.width / 2) + position.distance;
        const b = (position.height / 2) + position.distance;

        const closestRightAngle = Math.round(angle / 90) * 90;
        const isHorizontal = closestRightAngle % 180 === 0;

        const tanv = Math.tan((Math.abs(closestRightAngle - angle) * Math.PI) / 180);
        const xAbs = isHorizontal ? a : a * tanv;
        const yAbs = isHorizontal ? b * tanv : b;

        const x = (angle < 90 || angle > 270) ? xAbs : -xAbs;
        const y = (angle < 180) ? yAbs : -yAbs;

        return {
            ...position,
            left: (position.x + x) - (position.width / 2),
            top: (position.y + y) - (position.height / 2),
            angle,
        };
    }

    // FIXME: Wait for web fonts to load to get correct width and height of children
    componentDidMount() {
        this.updateChildren();
    }

    componentDidUpdate() {
        this.updateChildren();
    }

    updateChildren() {
        const width = this.root.offsetWidth;
        const height = this.root.offsetHeight;
        const steps = [90, 45, 3];

        // Get refs to mounted children
        const refs = this.childRefs.filter(child => !!child);

        let positions = refs
            .map(child => child.getPosition())
            .map(position => ItemContainer.updatePosition(position));
        let count = ItemContainer.getCollisionCount(width, height, positions);

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            if (count <= 0) break;
            const step = steps[i % steps.length];
            for (let index = 0; index < positions.length; index++) {
                if (!positions[index].isFixed) {
                    const positionsCW = ItemContainer.getUpdatedPositions(positions, index, step);
                    const positionsCCW = ItemContainer.getUpdatedPositions(positions, index, -step);
                    const countCW = ItemContainer.getCollisionCount(width, height, positionsCW);
                    const countCCW = ItemContainer.getCollisionCount(width, height, positionsCCW);

                    if (countCW <= count || countCCW <= count) {
                        count = countCW < countCCW ? countCW : countCCW;
                        positions = countCW < countCCW ? positionsCW : positionsCCW;
                    }
                }
            }
        }

        refs.forEach((ref, index) => {
            ref.setPosition(positions[index].top, positions[index].left);
        });
    }

    render() {
        this.childRefs = [];
        const children = React.Children.map(this.props.children, (child, index) => {
            const props = { ref: (ref) => { this.childRefs[index] = ref; } };
            return child ? React.cloneElement(child, props) : null;
        });
        return (
            <div className={styles.root} ref={(ref) => { this.root = ref; }}>
                {children}
            </div>
        );
    }
}

export default ItemContainer;


