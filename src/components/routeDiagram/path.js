import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import Destinations from './destinations';
import Stop from './stop';
import Gap from './gap';
import Zone from './zone';

import styles from './path.css';

// Must match width and radius values in CSS
const PATH_WIDTH = 225;
const PATH_WIDTH_WIDER = 251;
const LINE_RADIUS = 10;

const COMPACT_PATH_WIDTH = PATH_WIDTH * 0.88;
const COMPACT_PATH_WIDTH_WIDER = PATH_WIDTH_WIDER * 0.88;

class Path extends Component {
  hasTerminalId = branch => {
    let foundTerminalId = false;
    branch.items.forEach(item => {
      if (item.terminalId && item.routeSegments.length > 1) {
        foundTerminalId = true;
      }
    });
    return foundTerminalId;
  };

  getWidth = (nodes, isRoot = true) => {
    const { useCompactLayout } = this.props;
    let width = 0;
    nodes.forEach((node, index) => {
      if (!node.children || (isRoot && index === nodes.length - 1)) {
        if (this.hasTerminalId(node)) {
          width += useCompactLayout ? COMPACT_PATH_WIDTH_WIDER : PATH_WIDTH_WIDER;
        } else {
          width += useCompactLayout ? COMPACT_PATH_WIDTH : PATH_WIDTH;
        }
      } else {
        width += this.getWidth(node.children, false);
      }
    });

    const rootWidePath = useCompactLayout ? COMPACT_PATH_WIDTH_WIDER : PATH_WIDTH_WIDER;
    const rootPath = useCompactLayout ? COMPACT_PATH_WIDTH : PATH_WIDTH;

    return isRoot
      ? width -
          (this.hasTerminalId(nodes[nodes.length - 1]) ? rootWidePath : rootPath) -
          LINE_RADIUS
      : width;
  };

  getDestinationRouteIds = items => {
    const destinationRouteIds = [];
    items.forEach(item => {
      if (item.destinations) {
        item.destinations.forEach(destination => destinationRouteIds.push(destination.routeId));
      }
    });
    return destinationRouteIds;
  };

  isLastStop = item => !!item.destinations && item.destinations.length > 0;

  isFirstStop = (item, index) => !!item.destinations && item.destinations.length > 0 && index === 0;

  render() {
    const destinationRouteIds = this.getDestinationRouteIds(this.props.items);
    const hasTerminalId = this.hasTerminalId(this.props);
    return (
      <div className={styles.root}>
        <div className={styles.header} />
        {this.props.items.map((item, index) => (
          <div
            key={index}
            className={classNames({
              [styles.compact]: this.isLastStop && this.props.useCompactLayout,
            })}>
            {item.type === 'stop' && (
              <Stop
                {...item}
                isFirst={this.isFirstStop(item, index)}
                isLast={this.isLastStop(item)}
                destinationRouteIds={destinationRouteIds}
                hasTerminalId={hasTerminalId}
                useCompactLayout={this.props.useCompactLayout}
              />
            )}
            {item.type === 'gap' && <Gap />}
            {item.type === 'zone' && <Zone {...item} />}
            {item.destinations && <Destinations destinations={item.destinations} />}
          </div>
        ))}
        {this.props.children && (
          <div>
            <div className={styles.footer} style={{ width: this.getWidth(this.props.children) }} />
            <div className={styles.children}>
              {this.props.children.map((branch, index) => (
                <Path key={index} {...branch} useCompactLayout={this.props.useCompactLayout} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}

Path.defaultProps = {
  children: null,
  useCompactLayout: false,
};

Path.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['stop', 'gap', 'zone']).isRequired,
      destinations: PropTypes.arrayOf(PropTypes.object),
    }),
  ).isRequired,
  useCompactLayout: PropTypes.bool,
};

// eslint-disable-next-line
Path.propTypes.children = PropTypes.arrayOf(PropTypes.shape(Path.propTypes));

export default Path;
