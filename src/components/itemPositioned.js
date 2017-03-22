import React, { Component } from "react";

class ItemPositioned extends Component {
    constructor(props) {
        super(props);
        // Use anchor coordinates before actual position is computed
        this.state = { top: props.x, left: props.y };
    }

    setPosition(top, left) {
        this.setState({ top, left });
    }

    getPosition() {
        return {
            width: this.root.offsetWidth,
            height: this.root.offsetHeight,
            x: this.props.x,
            y: this.props.y,
            distance: this.props.distance,
            angle: this.props.angle,
        };
    }

    render() {
        const style = { ...this.state, position: "absolute" };
        return (
            <div ref={(ref) => { this.root = ref; }} style={style}>
                {this.props.children}
            </div>
        );
    }
}

ItemPositioned.defaultProps = {
    angle: 0,
};

ItemPositioned.propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    distance: React.PropTypes.number.isRequired,
    angle: React.PropTypes.number,
    children: React.PropTypes.element.isRequired,
};

export default ItemPositioned;
