import React from 'react';
import PropTypes from 'prop-types';
import chunk from 'lodash/chunk';
import cloneDeep from 'lodash/cloneDeep';
import sortBy from 'lodash/sortBy';
import { Column } from '../util';
import { isTrunkRoute } from '../../util/domain';
import styles from '../stopPoster/routes.css';
import routesContainer from '../stopPoster/routesContainer';

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

function SimpleRoutes(props) {
  const routes = mapRoutesByDestination(props.routes);
  const routesPerColumn = Math.ceil(routes.length / 2);
  const routeColumns = chunk(
    sortBy(routes, route => !isTrunkRoute(route.routeId)),
    routesPerColumn,
  );

  return (
    <div className={[styles.root, styles.simple].join(' ')}>
      {routeColumns.map((routeColumn, i) => (
        <Column className={styles.column} key={i}>
          {routeColumn.map(route => (
            <div className={styles.groupA4} key={`route_row_${route.routeId}`}>
              <div className={styles.routeIdsContainer}>
                {route.routeIds.map((routeId, index) =>
                  index === route.routeIds.length - 1 ? (
                    <div
                      key={routeId}
                      className={route.routeIds.length > 1 ? styles.id : styles.singleId}>
                      {routeId}
                    </div>
                  ) : (
                    <div key={routeId} className={styles.id}>
                      {`${routeId}, `}
                    </div>
                  ),
                )}
              </div>
              <div className={styles.routeTitles}>
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
      ))}
    </div>
  );
}

SimpleRoutes.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      routeId: PropTypes.string.isRequired,
      destinationFi: PropTypes.string.isRequired,
      destinationSe: PropTypes.string,
    }),
  ).isRequired,
};

export default routesContainer(SimpleRoutes);
