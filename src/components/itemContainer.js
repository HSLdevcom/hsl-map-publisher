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

    componentDidMount() {
        this.updateChildren();
    }

    componentDidUpdate() {
        this.updateChildren();
    }

    getCollisionCount(width, height, childPositions) {
        const buffer = new CollisionBuffer(width, height);
        for (const position of childPositions) {
            // TODO: Use top and left instead of x and y
            buffer.addRectangle({
                left: Math.floor(position.x),
                top: Math.floor(position.y),
                width: Math.floor(position.width),
                height: Math.floor(position.height),
            });
        }
        return buffer.getCollisionCount();
    }

    getUpdatedPositions(childPositions, childIndex, diff) {
        return childPositions.map((position, index) => {
            if (index === childIndex) {
                // TODO: Rotate instead of moving on x axis
                return { ...position, x: position.x + diff };
            }
            return position;
        });
    }

    updateChildren() {
        const width = this.root.offsetWidth;
        const height = this.root.offsetHeight;

        console.log(`Root w/h: ${width} ${height}`); // eslint-disable-line
        console.log(`Child count: ${this.childRefs.length}`); // eslint-disable-line

        let childPositions = this.childRefs.map(child => child.getPosition());

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            let isPositionsUpdated = false;
            for (let childIndex = 0; childIndex < childPositions.length; childIndex++) {
                if (!childPositions[childIndex].isFixed) {
                    const leftPositions = this.getUpdatedPositions(childPositions, childIndex, -5);
                    const rightPositions = this.getUpdatedPositions(childPositions, childIndex, 5);
                    const originalCost = this.getCollisionCount(width, height, childPositions);
                    const leftCost = this.getCollisionCount(width, height, leftPositions);
                    const rightCost = this.getCollisionCount(width, height, rightPositions);

                    if (leftCost < originalCost || rightCost < originalCost) {
                        childPositions = leftCost < rightCost ? leftPositions : rightPositions;
                        isPositionsUpdated = true;
                    }
                }
            }
            if (!isPositionsUpdated) {
                console.log("Placement not updated, breaking"); // eslint-disable-line
                break;
            }
        }

        this.childRefs.forEach((ref, index) => {
            ref.setPosition(childPositions[index].x, childPositions[index].y);
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
