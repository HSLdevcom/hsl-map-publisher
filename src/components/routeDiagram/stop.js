import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { iconsByMode, trimRouteId, routeGeneralizer, getColor } from 'util/domain';
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
    const trunkRoutes = [];
    props.routeSegments
      .filter(segment => ['BUS', 'TRAM'].includes(segment.route.nodes[0].mode)) // Assume only one mode for a route
      .forEach(segment => {
        const routeId = trimRouteId(segment.routeId);
        if (!props.destinationRouteIds.includes(routeId) && segment.hasRegularDayDepartures) {
          if (!routes.includes(routeId)) {
            routes.push(routeId);
            if (segment.trunkRoute) {
              trunkRoutes.push(routeId);
            }
          }
        }
      });
    return { routes: routeGeneralizer(routes), trunkRoutes };
  };

  render() {
    const modes = new Set();
    if (metroRegexp.test(this.props.nameFi)) modes.add('SUBWAY');
    this.props.transferModes.forEach(mode => modes.add(mode));

    const terminalAreaRouteList = this.getTerminalAreaRoutes(this.props);
    const terminalAreaRoutes = terminalAreaRouteList.routes.map((route, index) => {
      return {
        text: route.text,
        trunkRoute: terminalAreaRouteList.trunkRoutes.includes(route.text),
      };
    });
    if (terminalAreaRoutes.length - 1 >= MAX_TERMINAL_ROUTE_DIVS) {
      terminalAreaRoutes.length = MAX_TERMINAL_ROUTE_DIVS;
      terminalAreaRoutes.push({ text: '...' });
    }

    const terminalAreaRouteDivs = terminalAreaRoutes.map((item, index) => {
      return (
        <span key={index} className={styles.routeContainer} style={{ color: getColor(item) }}>
          {item.text}
        </span>
      );
    });

    const showTerminalAreaRoutesContainer =
      terminalAreaRouteDivs.length > 0 && this.props.terminalId;

    return (
      <div
        ref={divElement => {
          this.divElement = divElement;
        }}
        className={classNames(styles.root, {
          [styles.compact]: this.props.useCompactLayout,
        })}>
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
  useCompactLayout: false,
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
  useCompactLayout: PropTypes.bool,
};

export default Stop;
