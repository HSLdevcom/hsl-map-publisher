import React, { Component } from "react";

import styles from "./itemWrapper.css";

class ItemWrapper extends Component {
    constructor(props) {
        super(props);
        this.initialState = { top: 0, left: 0 };
    }

    setPosition(left, top) {
        this.setState({ top, left });
    }

    getPosition() {
        return {
            x: this.props.x,
            y: this.props.y,
            isFixed: this.props.isFixed,
            distance: this.props.distance,
            width: this.root.offsetWidth,
            height: this.root.offsetHeight,
        };
    }

    render() {
        return (
            <div ref={(ref) => { this.root = ref; }} className={styles.root} style={this.state}>
                {this.props.children}
            </div>
        );
    }
}

export default ItemWrapper;
