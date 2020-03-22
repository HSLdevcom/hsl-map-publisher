import React, { Component } from 'react';
import PropTypes from 'prop-types';
import chunk from 'lodash/chunk';
import sortBy from 'lodash/sortBy';
import { Row, Column, InlineSVG } from 'components/util';
import routesContainer from './routesContainer';
import renderQueue from 'util/renderQueue';
import { isTrunkRoute, getColor, getIcon } from 'util/domain';

import styles from './routes.css';

const MAX_COLUMNS = 6;

class Routes extends Component {
  static propTypes = {
    routes: PropTypes.arrayOf(
      PropTypes.shape({
        routeId: PropTypes.string.isRequired,
        destinationFi: PropTypes.string.isRequired,
        destinationSe: PropTypes.string,
      }),
    ).isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { columns: MAX_COLUMNS };
  }

  componentDidMount() {
    this.updateLayout();
  }

  componentWillReceiveProps() {
    this.setState({ columns: MAX_COLUMNS });
  }

  componentDidUpdate() {
    this.updateLayout();
  }

  componentWillUnmount() {
    renderQueue.remove(this);
  }

  routeContent = route =>
    route.multiline ? (
      <Row>
        <Column>
          <div className={styles.title}>{route.destinationFi}</div>
          <div className={styles.subtitle}>{route.destinationSe}</div>
        </Column>
        <Column>
          <div className={styles.viaTitle}>via</div>
          <div className={styles.viaTitle}>{route.viaFi}</div>
          <div className={styles.viaSubtitle}>{route.viaSe}</div>
        </Column>
      </Row>
    ) : (
      <div>
        <div className={styles.title}>
          {route.destinationFi + (route.viaFi ? ` via ${route.viaFi}` : '')}
        </div>
        <div className={styles.subtitle}>
          {route.destinationSe + (route.viaSe ? ` via ${route.viaSe}` : '')}
        </div>
      </div>
    );

  updateLayout() {
    if (this.hasOverflow()) {
      if (this.state.columns > 0) {
        renderQueue.add(this);
        this.setState(state => ({ columns: state.columns - 1 }));
        return;
      }
      renderQueue.remove(this, { error: new Error('Failed to remove routes overflow') });
      return;
    }
    renderQueue.remove(this);
  }

  hasOverflow() {
    return this.root.scrollWidth > this.root.clientWidth;
  }

  render() {
    const routes = this.props.routes.map(route => {
      const newRoute = route;
      if (this.state.columns === 0 && (route.viaFi || route.viaSe)) {
        newRoute.multiline = true;
      }
      return newRoute;
    });
    const routesPerColumn = Math.ceil(routes.length / this.state.columns);
    const routeColumns = chunk(
      sortBy(routes, route => !isTrunkRoute(route.routeId)),
      routesPerColumn,
    );
    return (
      <div
        className={styles.root}
        ref={ref => {
          this.root = ref;
        }}>
        {routeColumns.map((routeColumn, i) => (
          <Row key={i}>
            <Column>
              {routeColumn.map((route, index) => (
                <div key={index} className={styles.group}>
                  <InlineSVG className={styles.icon} src={getIcon(route)} />
                </div>
              ))}
            </Column>
            <Column>
              {routeColumn.map((route, index) => (
                <div key={index} className={styles.group}>
                  <div className={styles.id} style={{ color: getColor(route) }}>
                    {route.routeId}
                  </div>
                </div>
              ))}
            </Column>
            <Column>
              {routeColumn.map((route, index) => (
                <div key={index} className={styles.group} style={{ color: getColor(route) }}>
                  {this.routeContent(route)}
                </div>
              ))}
            </Column>
          </Row>
        ))}
      </div>
    );
  }
}

export default routesContainer(Routes);
