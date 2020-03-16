import React from 'react';
import PropTypes from 'prop-types';
import uniqBy from 'lodash/uniqBy';

import { Row, Column, Spacer } from 'components/util';
import { getColor } from 'util/domain';

import styles from './stopLabel.css';

// Max rows in label
const MAX_LABEL_ROWS = 6;
const MAX_LABEL_CHARS = 36;

const mapRoutesByDestination = routes => {
  const routeSet = {};
  routes.forEach(route => {
    const key = `${route.destinationFi}${route.viaFi}`;
    if (!routeSet[key]) {
      const newRoute = route;
      newRoute.routeIds = [route.routeId];
      routeSet[key] = newRoute;
    } else {
      const newRouteIds = routeSet[key].routeIds;
      newRouteIds.push(route.routeId);
      routeSet[key].routeIds = newRouteIds;
    }
  });
  return Object.values(routeSet);
};

const RouteList = props => {
  if (props.routes.length > MAX_LABEL_ROWS) {
    let rowLength = 0;
    const components = uniqBy(props.routes, route => route.routeId).map((route, index, routes) => {
      const content = `${route.routeId}${index < routes.length - 1 ? ', ' : ''}`;
      const isNewLine = rowLength + content.length > MAX_LABEL_CHARS;
      rowLength = isNewLine ? content.length : rowLength + content.length;
      return (
        <span className={styles.route} key={index} style={{ color: getColor(route) }}>
          {isNewLine && <br />}
          {content}
        </span>
      );
    });
    return <div>{components}</div>;
  }
  return (
    <div>
      {mapRoutesByDestination(props.routes).map((route, index) => (
        <div className={styles.flexContainer} key={`route_row_${route.routeId}${index}`}>
          <div
            key={index}
            className={
              route.routeIds.length > 2 ? styles.routeIdsContainerWide : styles.routeIdsContainer
            }>
            {route.routeIds.map((routeId, i) => {
              const routeIdDiv = (
                <span key={`route_id_${routeId}${i}`} style={{ color: getColor(route) }}>
                  {routeId}
                </span>
              );
              return i === route.routeIds.length - 1 ? (
                routeIdDiv
              ) : (
                <div style={{ 'white-space': 'pre' }}>
                  {routeIdDiv}
                  {', '}
                </div>
              );
            })}
          </div>
          <Spacer width={6} />
          <div className={styles.flexContainer}>
            <div className={styles.destinationContainer}>
              <span className={styles.destination}>
                {route.destinationFi + (route.viaFi ? ` kautta ${route.viaFi}` : '')}
              </span>
              {'\xa0'}
              <span className={styles.destinationLight}>
                {route.destinationSe + (route.viaSe ? ` via ${route.viaSe}` : '')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

RouteList.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      routeId: PropTypes.string.isRequired,
      destinationFi: PropTypes.string.isRequired,
      destinationSe: PropTypes.string,
    }),
  ).isRequired,
};

const StopLabel = props => (
  <div className={styles.label}>
    <div className={styles.title}>
      {props.nameFi} {props.shortId && `(${props.shortId.replace(/\s+/g, '')})`}
    </div>
    <div className={styles.subtitle}>{props.nameSe}</div>
    <div className={styles.content}>
      <RouteList routes={props.routes} />
    </div>
  </div>
);

StopLabel.defaultProps = {
  nameSe: null,
  shortId: null,
};

StopLabel.propTypes = {
  ...RouteList.propTypes.routes,
  nameFi: PropTypes.string.isRequired,
  nameSe: PropTypes.string,
  shortId: PropTypes.string,
};

export default StopLabel;
