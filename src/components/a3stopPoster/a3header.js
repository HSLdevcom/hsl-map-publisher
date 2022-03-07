import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { chunk, cloneDeep, sortBy } from 'lodash';
import { Row, Column, InlineSVG } from 'components/util';
import a3headerContainer from './a3headerContainer';
import renderQueue from 'util/renderQueue';
import { isTrunkRoute, getColor, getIcon, routeGeneralizer } from 'util/domain';
import SimpleRoutes from '../timetable/simpleRoutes';

import styles from './a3header.css';

const MAX_COLUMNS = 5;

class A3Header extends Component {
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
    this.state = {
      simpleRoutes: false,
      hideDestinations: false,
    };
  }

  componentDidMount() {
    this.updateLayout();
  }

  componentDidUpdate() {
    this.updateLayout();
  }

  componentWillUnmount() {
    renderQueue.remove(this);
  }

  hasOverflow() {
    return (
      this.root.scrollWidth > this.root.clientWidth ||
      this.root.scrollHeight > this.root.clientHeight
    );
  }

  updateLayout() {
    if (this.hasOverflow()) {
      if (!this.state.simpleRoutes) {
        renderQueue.add(this);
        this.setState({ simpleRoutes: true });
        return;
      }
      if (this.state.simpleRoutes) {
        renderQueue.add(this);
        this.setState({ hideDestinations: true });
        return;
      }
      renderQueue.remove(this, { error: new Error('Failed to remove routes overflow') });
      return;
    }
    renderQueue.remove(this);
  }

  render() {
    const routesPerColumn = Math.ceil(this.props.routes.length / MAX_COLUMNS);
    const routeColumns = chunk(
      sortBy(this.props.routes, route => !isTrunkRoute(route.routeId)),
      routesPerColumn,
    );
    const routeIds = this.props.routes.map(route => route.routeId);

    const routeIdsStr = routeIds.join(', ');
    return (
      <div
        className={styles.root}
        ref={ref => {
          this.root = ref;
        }}>
        <div className={styles.stopTitleContainer}>
          <div className={styles.stopTitle}>{this.props.stop.nameFi}</div>
          <div className={styles.stopTitle}>{this.props.stop.nameSe}</div>
        </div>
        {!this.state.simpleRoutes && (
          <div className={styles.routesContainer}>
            {routeColumns.map((routes, i) => (
              <Row key={i} style={{ alignItems: 'baseline' }}>
                <Column>
                  {routes.map((route, index) => (
                    <div key={index} className={styles.group}>
                      <div className={styles.id} style={{ color: getColor(route) }}>
                        {route.routeId}
                      </div>
                      <div
                        key={index}
                        className={styles.destinations}
                        style={{ color: getColor(route) }}>
                        <div className={styles.title}>
                          {route.destinationFi + (route.viaFi ? ` kautta ${route.viaFi}` : '')}
                        </div>
                        <div className={styles.subtitle}>
                          {route.destinationSe + (route.viaSe ? ` via ${route.viaSe}` : '')}
                        </div>
                      </div>
                    </div>
                  ))}
                </Column>
              </Row>
            ))}
          </div>
        )}
        {this.state.simpleRoutes && !this.state.hideDestinations && (
          <SimpleRoutes
            printAsA3
            stopIds={[this.props.variables.stopId]}
            date={this.props.variables.date}
          />
        )}
        {this.state.simpleRoutes && this.state.hideDestinations && (
          <div className={styles.simplestRoutes}>{routeIdsStr}</div>
        )}
        <div className={styles.stopIdContainer}>
          <div className={styles.stopIdTitle}>Pysäkkinumero</div>
          <div className={styles.stopIdTitle}>Hållplatsnummer</div>
          <div className={styles.stopId}>{this.props.stop.shortId.replace(' ', '')}</div>
        </div>
      </div>
    );
  }
}

A3Header.propTypes = {
  stop: PropTypes.object.isRequired,
  variables: PropTypes.object.isRequired,
};

export default a3headerContainer(A3Header);
