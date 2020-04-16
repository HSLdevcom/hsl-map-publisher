import React, { Component } from 'react';
import PropTypes from 'prop-types';
import renderQueue from 'util/renderQueue';

import ItemOverlay from './itemOverlay';
import OptimizePositionsWorker from './optimizePositions.worker';

import styles from './itemContainer.css';

/**
 * Container that optimizes the positions of its children
 */
class ItemContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.updateChildren();
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      this.worker.terminate();
      this.updateChildren();
    }
  }

  componentWillUnmount() {
    this.worker.terminate();
  }

  updateChildren() {
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

    this.worker = new OptimizePositionsWorker();

    this.worker.addEventListener('message', event => {
      const positions = event.data;
      refs.forEach((ref, index) => ref.setPosition(positions[index].top, positions[index].left));
      this.setState({ items: positions.filter(({ isFixed }) => !isFixed) });
      renderQueue.remove(this);
    });

    this.worker.addEventListener('error', event => {
      renderQueue.remove(this, { error: new Error(event.message) });
    });

    this.worker.postMessage({ positions: initialPositions, boundingBox });
  }

  render() {
    this.childRefs = [];
    const children = React.Children.map(this.props.children, (child, index) => {
      const props = {
        ref: ref => {
          this.childRefs[index] = ref;
        },
      };
      return child ? React.cloneElement(child, props) : null;
    });
    return (
      <div
        className={styles.root}
        ref={ref => {
          this.root = ref;
        }}>
        {this.state.items && (
          <ItemOverlay
            width={this.root.offsetWidth}
            height={this.root.offsetHeight}
            items={this.state.items}
          />
        )}
        {children}
      </div>
    );
  }
}

ItemContainer.propTypes = {
  children: PropTypes.node.isRequired, // ItemFixed or ItemPositioned components
};

export default ItemContainer;
