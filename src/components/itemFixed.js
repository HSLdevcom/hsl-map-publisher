import React, { Component } from "react";

class ItemFixed extends Component {
    constructor(props) {
        super(props);
        this.state = { top: props.top, left: 0 };
    }

    setPosition(top, left) {
        this.setState({ top, left });
    }

    getPosition() {
        return {
            top: this.props.top,
            left: this.props.left,
            width: this.root.offsetWidth,
            height: this.root.offsetHeight,
            isFixed: true,
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

ItemFixed.propTypes = {
    top: React.PropTypes.number.isRequired,
    left: React.PropTypes.number.isRequired,
    children: React.PropTypes.element.isRequired,
};

export default ItemFixed;
