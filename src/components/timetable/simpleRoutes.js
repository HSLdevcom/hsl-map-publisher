import React from 'react';
import PropTypes from 'prop-types';
import chunk from 'lodash/chunk';
import sortBy from 'lodash/sortBy';
import { Row, Column, InlineSVG } from '../util';
import { isTrunkRoute, getColor, getIcon } from '../../util/domain';
import styles from '../stopPoster/routes.css';
import routesContainer from '../stopPoster/routesContainer';

function SimpleRoutes(props) {
  const routesPerColumn = Math.ceil(props.routes.length / 2);
  const routeColumns = chunk(
    sortBy(props.routes, route => !isTrunkRoute(route.routeId)),
    routesPerColumn,
  );

  return (
    <div className={[styles.root, styles.simple].join(' ')}>
      {routeColumns.map((routes, i) => (
        <Column className={styles.column} key={i}>
          {routes.map(route => (
            <div
              className={styles.group}
              key={`route_row_${route.routeId}`}
              style={{ color: getColor(route) }}>
              <div className={styles.id}>{route.routeId}</div>
              <div className={styles.title}>
                {route.destinationFi + (route.viaFi ? ` kautta ${route.viaFi}` : '')}
              </div>
              <div className={styles.subtitle}>
                {route.destinationSe + (route.viaSe ? ` via ${route.viaSe}` : '')}
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
