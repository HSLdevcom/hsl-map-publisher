import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ItemPositioned extends Component {
  constructor(props) {
    super(props);
    // Use anchor coordinates before actual position is computed
    this.state = { top: props.y, left: props.x };
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
      initialDistance: this.props.distance,
      initialAngle: this.props.angle,
    };
  }

  render() {
    const style = { ...this.state, position: 'absolute' };
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

ItemPositioned.defaultProps = {
  angle: 0,
  distance: 0,
};

ItemPositioned.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  distance: PropTypes.number,
  angle: PropTypes.number,
  children: PropTypes.element.isRequired,
};

export default ItemPositioned;
