import React from 'react';
import PropTypes from 'prop-types';
import { chunk, cloneDeep, sortBy } from 'lodash';
import { routeGeneralizer } from 'util/domain';

import { Column } from '../util';

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
  const generalizedRouteSet = Object.values(routeSet).map(route => {
    const newRoute = cloneDeep(route);
    const generalizedRouteIds = routeGeneralizer(newRoute.routeIds);
    const routeIds = generalizedRouteIds.map(routeId => routeId.text);
    newRoute.routeIds = routeIds;
    return newRoute;
  });
  return generalizedRouteSet;
};

function SimpleRoutes(props) {
  const routes = mapRoutesByDestination(props.routes);
  const routesPerColumn = Math.ceil(routes.length / 2);
  const routeColumns = chunk(
    sortBy(routes, route => !route.trunkRoute),
    routesPerColumn,
  );

  let containerStyle = [styles.root, styles.simple].join(' ');
  let columnStyle = styles.column;
  if (props.printAsA3) {
    containerStyle = [containerStyle, styles.a3].join(' ');
    columnStyle = [styles.column, styles.a3].join(' ');
  }
  return (
    <div className={containerStyle}>
      {routeColumns.map((routeColumn, i) => (
        <Column className={columnStyle} key={i}>
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

SimpleRoutes.defaultProps = {
  printAsA3: false,
};

SimpleRoutes.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      routeId: PropTypes.string.isRequired,
      destinationFi: PropTypes.string.isRequired,
      destinationSe: PropTypes.string,
    }),
  ).isRequired,
  printAsA3: PropTypes.bool,
};

export default routesContainer(SimpleRoutes);
