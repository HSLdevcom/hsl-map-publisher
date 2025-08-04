import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ItemFixed extends Component {
  constructor(props) {
    super(props);
    this.state = { top: props.top, left: props.left };
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
    const style = { ...this.state, position: 'absolute' };
    if (this.props.width) {
      style.width = this.props.width;
    }
    if (this.props.height) {
      style.height = this.props.height;
    }
    return (
      <div
        ref={ref => {
          this.root = ref;
        }}
        style={style}>
        {this.props.children}
      </div>
    );
  }
}

ItemFixed.propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number.isRequired,
  children: PropTypes.element.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};

ItemFixed.defaultProps = {
  width: null,
  height: null,
};

export default ItemFixed;
