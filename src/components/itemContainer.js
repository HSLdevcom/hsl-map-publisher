import React, { Component } from "react";
import styles from "./itemContainer.css";

const MAX_ITERATIONS = 100;

class ItemContainer extends Component {

    // FIXME: Wait for web fonts to load to get correct width and height of children
    componentDidMount() {
        setTimeout(() =>  this.updateChildren(), 4000);
    }

    componentDidUpdate() {
        setTimeout(() =>  this.updateChildren(), 4000);
    }

    getIntersectionArea(a, b) {
        const width = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
        const height = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
        return Math.max(0, width) * Math.max(0, height);
    }

    getCollisionCount(width, height, positions) {
        const boundingBox = { left: 0, top: 0, width, height };
        let overflow = 0;
        let overlap = 0;
        for(let i = 0; i < positions.length; i++) {
            const rectArea = positions[i].width * positions[i].height;
            overflow += rectArea - this.getIntersectionArea(boundingBox, positions[i]);
            for(let j = i + 1; j < positions.length; j++) {
                overlap += this.getIntersectionArea(positions[i], positions[j]);
            }
        }
        return overlap + overflow;
    }

    updatePosition(position, angleDiff = 0) {
        const angle = position.angle + angleDiff;
        const a = position.width / 2 + position.distance;
        const b = position.height / 2 + position.distance;

        const tanv = Math.tan(angle * Math.PI / 180);
        const xAbs = a * b / Math.sqrt(Math.pow(b, 2) + Math.pow(a, 2) * Math.pow(tanv, 2));
        const yAbs = a * b / Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2) / Math.pow(tanv, 2));

        const x = Math.abs(angle) < 90 ? xAbs : - xAbs;
        const y = Math.abs(angle - 90) < 90 ? yAbs : - yAbs;

        return {
            ...position,
            left: position.x + x - position.width / 2,
            top: position.y + y - position.height / 2,
            angle,
        };
    }

    getUpdatedPositions(positions, indexToUpdate, angleDiff) {
        return positions.map((position, index) => {
            if (index === indexToUpdate) {
                return this.updatePosition(position, angleDiff);
            }
            return position;
        });
    }

    updateChildren() {
        const width = this.root.offsetWidth;
        const height = this.root.offsetHeight;

        let positions = this.childRefs
            .map(child => child.getPosition())
            .map(position => this.updatePosition(position));

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            let isPositionsUpdated = false;
            for (let index = 0; index < positions.length; index++) {
                if (!positions[index].isFixed) {
                    const positionsCW = this.getUpdatedPositions(positions, index, -1);
                    const positionsCCW = this.getUpdatedPositions(positions, index, 1);
                    const count = this.getCollisionCount(width, height, positions);
                    const countCW = this.getCollisionCount(width, height, positionsCW);
                    const countCCW = this.getCollisionCount(width, height, positionsCCW);

                    if (countCW < count || countCCW < count) {
                        positions = countCW < countCCW ? positionsCW : positionsCCW;
                        isPositionsUpdated = true;
                    }
                }
            }
            if (!isPositionsUpdated) break;
        }

        this.childRefs.forEach((ref, index) => {
            ref.setPosition(positions[index].top, positions[index].left);
        });
    }

    render() {
        this.childRefs = [];
        const children = React.Children.map(this.props.children, (child) => {
            const props = { ref: ref => this.childRefs.push(ref) };
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
