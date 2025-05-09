import React from 'react';
import classNames from 'classnames';
import { getColor } from 'util/domain';
import PropTypes from 'prop-types';
import groupBy from 'lodash/groupBy';
import { Row, WrappingRow, Column } from 'components/util';
import routeCompare from 'util/routeCompare';

import styles from './destinations.css';

const Destinations = props => {
  if (!props.destinations) {
    return null;
  }

  const destinationsByTitle = groupBy(props.destinations.sort(routeCompare), 'titleFi');

  return (
    <div className={styles.destinations}>
      {Object.values(destinationsByTitle).map((destinations, groupIndex) => (
        <WrappingRow key={groupIndex} style={{ marginBottom: 5 }}>
          {destinations.map((destination, index) => (
            <Row key={index}>
              <div className={classNames(styles.routeId)} style={{ color: getColor(destination) }}>
                {destination.routeId}
              </div>
            </Row>
          ))}
          <Column style={{ flexBasis: '100%' }}>
            <div className={styles.title} style={{ color: getColor(destinations[0]) }}>
              {destinations[0].titleFi}
            </div>
            <div className={styles.subtitle} style={{ color: getColor(destinations[0]) }}>
              {destinations[0].titleSe}
            </div>
          </Column>
        </WrappingRow>
      ))}
    </div>
  );
};

Destinations.propTypes = {
  destinations: PropTypes.arrayOf(
    PropTypes.shape({
      routeId: PropTypes.string.isRequired,
      titleFi: PropTypes.string.isRequired,
      titleSe: PropTypes.string,
    }),
  ).isRequired,
};

export default Destinations;
