import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { iconsByMode, trimRouteId, routeGeneralizer } from 'util/domain';
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
    const height = this.divElement.clientHeight - 8;
    this.setState({ height });
  }

  getTerminalAreaRoutes = props => {
    const routes = [];
    props.routeSegments.nodes
      .filter(segment => ['BUS', 'TRAM'].includes(segment.route.nodes[0].mode)) // Assume only one mode for a route
      .forEach(segment => {
        const routeId = trimRouteId(segment.routeId);
        if (!props.destinationRouteIds.includes(routeId) && segment.hasRegularDayDepartures) {
          if (!routes.includes(routeId)) {
            routes.push(routeId);
          }
        }
      });
    return routeGeneralizer(routes);
  };

  render() {
    const modes = new Set();
    if (metroRegexp.test(this.props.nameFi)) modes.add('SUBWAY');
    this.props.transferModes.forEach(mode => modes.add(mode));

    const terminalAreaRoutes = this.getTerminalAreaRoutes(this.props);
    if (terminalAreaRoutes.length - 1 >= MAX_TERMINAL_ROUTE_DIVS) {
      terminalAreaRoutes.length = MAX_TERMINAL_ROUTE_DIVS;
      terminalAreaRoutes.push({ text: '...' });
    }

    const terminalAreaRouteDivs = terminalAreaRoutes.map((item, index) => (
      <span key={index} className={styles.routeContainer}>
        {item.text}
      </span>
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
            <div>
              <div className={styles.terminalAreaRoutesTitle}>Linjat / Linjerna / Lines</div>
              <div className={styles.terminalAreaRoutesContainer}>{terminalAreaRouteDivs}</div>
            </div>
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
