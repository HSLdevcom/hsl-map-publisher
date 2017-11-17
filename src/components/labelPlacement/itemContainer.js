import React, { Component } from "react";
import PropTypes from "prop-types";
import renderQueue from "util/renderQueue";

import ItemOverlay from "./itemOverlay";
import optimizePositions from "./optimizePositions";

import styles from "./itemContainer.css";

/**
 * Container that optimizes the positions of its children
 */
class ItemContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.promise = this.updateChildren();
    }

    componentDidUpdate(prevProps) {
        if (prevProps !== this.props) {
            this.shouldCancel = true;
            this.promise = this.promise.then(() => {
                this.shouldCancel = false;
                return this.updateChildren();
            });
        }
    }

    componentWillUnmount() {
        this.shouldCancel = true;
    }

    async updateChildren() {
        renderQueue.add(this);

        const boundingBox = {
            left: 0,
            top: 0,
            width: this.root.offsetWidth,
            height: this.root.offsetHeight,
        };

        // Get refs to mounted children
        const refs = this.childRefs.filter(ref => !!ref);

        // Get initial positions
        const initialPositions = refs.map(ref => ref.getPosition());

        const positions = await optimizePositions(initialPositions, boundingBox, this);

        if (positions) {
            refs.forEach((ref, index) => (
                ref.setPosition(positions[index].top, positions[index].left)
            ));
            this.setState({ items: positions.filter(({ isFixed }) => !isFixed) });
        }

        renderQueue.remove(this);
    }

    render() {
        this.childRefs = [];
        const children = React.Children.map(this.props.children, (child, index) => {
            const props = { ref: (ref) => { this.childRefs[index] = ref; } };
            return child ? React.cloneElement(child, props) : null;
        });
        return (
            <div className={styles.root} ref={(ref) => { this.root = ref; }}>
                {this.state.items && <ItemOverlay
                    width={this.root.offsetWidth}
                    height={this.root.offsetHeight}
                    items={this.state.items}
                />}
                {children}
            </div>
        );
    }
}

ItemContainer.propTypes = {
    children: PropTypes.node.isRequired, // ItemFixed or ItemPositioned components
};

export default ItemContainer;
