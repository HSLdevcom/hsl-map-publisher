import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { iconsByMode, trimRouteId } from 'util/domain';
import { Column, InlineSVG } from 'components/util';
import styles from './stop.css';

const metroRegexp = / ?\(M\)$/;
const MAX_TERMINAL_ROUTE_DIVS = 25;

class Stop extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const height = this.divElement.clientHeight - 10;
    this.setState({ height });
  }

  extractNumbers = routeId => {
    const matches = routeId.match(/(\d+)/);
    return matches[0];
  };

  getTerminalAreaRoutes = props => {
    const routes = [];
    props.routeSegments.nodes.forEach(segment => {
      const routeId = trimRouteId(segment.routeId);
      const routeIdNumber = this.extractNumbers(routeId);
      if (!props.destinationRouteIds.includes(routeId) && segment.hasRegularDayDepartures)
        routes.push({ routeId, routeIdNumber });
    });
    const routeIds = [];
    routes
      .sort((a, b) => a.routeIdNumber - b.routeIdNumber)
      .forEach(route => {
        const { routeId } = route;
        if (!routeIds.includes(routeId)) routeIds.push(routeId);
      });

    return routeIds;
  };

  render() {
    const modes = new Set();
    if (metroRegexp.test(this.props.nameFi)) modes.add('SUBWAY');
    this.props.transferModes.forEach(mode => modes.add(mode));

    const terminalAreaRoutes = this.getTerminalAreaRoutes(this.props);
    if (terminalAreaRoutes.length - 1 >= MAX_TERMINAL_ROUTE_DIVS) {
      terminalAreaRoutes.length = MAX_TERMINAL_ROUTE_DIVS;
      terminalAreaRoutes.push('...');
    }

    const terminalAreaRouteDivs = terminalAreaRoutes.map((route, index) => (
      <div key={index} className={styles.routeContainer}>
        {route}
      </div>
    ));

    const showTerminalAreaRoutesContainer =
      terminalAreaRouteDivs.length > 0 && this.props.terminalId;

    return (
      <div
        ref={divElement => {
          this.divElement = divElement;
        }}
        className={styles.root}>
        <div className={styles.left} />
        <div className={styles.separator}>
          <div
            style={{
              height: this.state.height ? `${this.state.height / 2}px` : '12px',
              borderLeft: 'var(--line-border)',
            }}
          />
          <div className={this.props.isLast ? styles.separatorLastStop : styles.separatorStop} />
          <div
            style={{
              height: this.state.height ? `${this.state.height / 2}px` : '12px',
              borderLeft: 'var(--line-border)',
              visibility: this.props.isLast ? 'hidden' : 'visible',
            }}
          />
        </div>
        <div className={this.props.hasTerminalId ? styles.rightWide : styles.right}>
          <div className={styles.titleContainer}>
            <Column>
              <div className={styles.title}>{this.props.nameFi.replace(metroRegexp, '')}</div>{' '}
              <div className={styles.subtitle}>
                {this.props.nameSe && this.props.nameSe.replace(metroRegexp, '')}
              </div>
            </Column>
          </div>
          <div className={styles.iconContainer}>
            {Array.from(modes).map((mode, index) => (
              <InlineSVG key={index} className={styles.icon} src={iconsByMode[mode]} />
            ))}
          </div>
          {showTerminalAreaRoutesContainer && (
            <div className={styles.terminalAreaRoutesContainer}>{terminalAreaRouteDivs}</div>
          )}
        </div>
      </div>
    );
  }
}

Stop.defaultProps = {
  nameSe: null,
  destinationRouteIds: [],
  terminalId: null,
};

Stop.propTypes = {
  terminalId: PropTypes.string,
  hasTerminalId: PropTypes.bool.isRequired,
  nameFi: PropTypes.string.isRequired,
  nameSe: PropTypes.string,
  isLast: PropTypes.bool.isRequired,
  isFirst: PropTypes.bool.isRequired,
  destinationRouteIds: PropTypes.array,
  transferModes: PropTypes.arrayOf(PropTypes.oneOf(['BUS', 'TRAM', 'FERRY', 'RAIL', 'SUBWAY']))
    .isRequired,
};

export default Stop;
