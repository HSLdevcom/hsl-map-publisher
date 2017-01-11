import React, { Component } from "react";

import styles from "./itemWrapper.css";

class ItemWrapper extends Component {
    constructor(props) {
        super(props);
        this.initialState = { top: 0, left: 0 };
    }

    setPosition(top, left) {
        this.setState({ top, left });
    }

    getPosition() {
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

    render() {
        return (
            <div ref={(ref) => { this.root = ref; }} className={styles.root} style={this.state}>
                {this.props.children}
            </div>
        );
    }
}

ItemWrapper.propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    angle: React.PropTypes.number,
    distance: React.PropTypes.number,
    isFixed: React.PropTypes.bool,
    children: React.PropTypes.element.isRequired,
};

export default ItemWrapper;
