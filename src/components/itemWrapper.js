import React, { Component } from "react";

import styles from "./itemWrapper.css";

class ItemWrapper extends Component {
    constructor(props) {
        super(props);
        this.initialState = { top: 0, left: 0 };
    }

    setPosition(top, left) {
        // TODO: Handle fixed wrappers
        if(!top || !left) return;
        this.setState({ top, left });
    }

    getPosition() {
        console.log("Wrapper request. Height " + this.root.offsetHeight);
        return {
            x: this.props.x,
            y: this.props.y,
            angle: this.props.angle || 0,
            distance: this.props.distance || 0,
            width: this.root.offsetWidth,
            height: this.root.offsetHeight,
            isFixed: !!this.props.isFixed,
        };
    }

    componentDidMount() {
        console.log("Wrapper did mount. Height: " + this.root.offsetHeight);
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
