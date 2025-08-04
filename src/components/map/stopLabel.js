import React from 'react';
import PropTypes from 'prop-types';
import uniqBy from 'lodash/uniqBy';

import { Spacer } from 'components/util';
import { getColor } from 'util/domain';

import styles from './stopLabel.css';

const MAX_LABEL_ROWS = 6;
const MAX_LABEL_CHARS = 36;
const MAX_ROUTEID_CHARS = 15;
const PIXELS_PER_CHAR = 7;

const mapRoutesByDestination = routes => {
  const routeSet = {};
  routes.forEach(route => {
    const key = `${route.destinationFi}${route.viaFi}`;
    if (!routeSet[key]) {
      const newRoute = route;
      newRoute.routeIds = [{ routeId: route.routeId, trunkRoute: route.trunkRoute }];
      routeSet[key] = newRoute;
    } else {
      const newRouteIds = routeSet[key].routeIds;
      newRouteIds.push({ routeId: route.routeId, trunkRoute: route.trunkRoute });
      routeSet[key].routeIds = newRouteIds;
    }
  });
  return Object.values(routeSet);
};

const routeIdsComponent = (routeId, mode, isNewLine, content, trunkRoute) => (
  <span
    className={styles.route}
    key={routeId}
    style={{ color: getColor({ routeId, mode, trunkRoute }) }}>
    {isNewLine && <br />}
    {content}
  </span>
);

const routeIdComponentWidth = routes => {
  let chars = 0;
  routes.forEach(route => {
    const { routeId } = route.routeIds[0];
    if (route.routeIds.length < 2 && routeId.length > chars) {
      chars = routeId.length;
    }
  });

  const width = chars * PIXELS_PER_CHAR;
  return width;
};

const RouteList = props => {
  if (props.routes.length > MAX_LABEL_ROWS) {
    let rowLength = 0;
    return (
      <div>
        {uniqBy(props.routes, route => route.routeId).map((route, index, routes) => {
          const content = `${route.routeId}${index < routes.length - 1 ? ', ' : ''}`;
          const isNewLine = rowLength + content.length > MAX_LABEL_CHARS;
          rowLength = isNewLine ? content.length : rowLength + content.length;
          return routeIdsComponent(route.routeId, route.mode, isNewLine, content, route.trunkRoute);
        })}
      </div>
    );
  }
  const combinedMapRoutes = mapRoutesByDestination(props.routes);
  const width = routeIdComponentWidth(combinedMapRoutes);

  return (
    <div>
      {combinedMapRoutes.map((route, index) => {
        let rowLength = 0;
        return (
          <div className={styles.flexContainer} key={`route_row_${route.routeId}${index}`}>
            <div
              key={index}
              style={route.routeIds.length > 1 ? { width: 'auto' } : { width: `${width}px` }}>
              {route.routeIds.map(({ routeId, trunkRoute }, i) => {
                const content = `${routeId}${i < route.routeIds.length - 1 ? ', ' : ''}`;
                const isNewLine = rowLength + content.length > MAX_ROUTEID_CHARS;
                rowLength = isNewLine ? content.length : rowLength + content.length;
                return routeIdsComponent(routeId, route.mode, isNewLine, content, trunkRoute);
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
        );
      })}
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
