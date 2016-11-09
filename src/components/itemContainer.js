import React, { Component } from "react";
import styles from "./itemContainer.css";

const MAX_ITERATIONS = 100;

class CollisionBuffer {
    constructor(width, height) {
        this.width = width;
        this.height = height;

        this.overflowCount = 0;
        this.cells = [];
        for (let y = 0; y < this.height; y++) {
            this.cells[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x] = 0;
            }
        }
    }

    addRectangle(dimensions) {
        const { left, top, width, height } = dimensions;
        for (let y = top; y < top + height; y++) {
            for (let x = left; x < left + width; x++) {
                if (x > 0 && x < this.width && y > 0 && y < this.height) {
                    this.cells[y][x] += 1;
                } else {
                    this.overflowCount += 1;
                }
            }
        }
    }

    getCollisionCount() {
        let overlapCount = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.cells[y][x] > 1) {
                    overlapCount += this.cells[y][x];
                }
            }
        }
        return overlapCount + this.overflowCount;
    }
}

class ItemContainer extends Component {

    // FIXME: Wait for web fonts to load to get correct width and height of children
    componentDidMount() {
        setTimeout(() =>  this.updateChildren(), 4000);
    }

    componentDidUpdate() {
        setTimeout(() =>  this.updateChildren(), 4000);
    }

    getCollisionCount(width, height, positions) {
        const buffer = new CollisionBuffer(width, height);
        for (const position of positions) {
            buffer.addRectangle({
                left: Math.floor(position.left),
                top: Math.floor(position.top),
                width: Math.floor(position.width),
                height: Math.floor(position.height),
            });
        }
        return buffer.getCollisionCount();
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
                    const leftPositions = this.getUpdatedPositions(positions, index, -5);
                    const rightPositions = this.getUpdatedPositions(positions, index, 5);
                    const originalCost = this.getCollisionCount(width, height, positions);
                    const leftCost = this.getCollisionCount(width, height, leftPositions);
                    const rightCost = this.getCollisionCount(width, height, rightPositions);

                    if (leftCost < originalCost || rightCost < originalCost) {
                        positions = leftCost < rightCost ? leftPositions : rightPositions;
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
