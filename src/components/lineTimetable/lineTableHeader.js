import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { filter } from 'lodash';

import styles from './lineTableHeader.css';

const LineTableHeader = props => {
  const filteredStops = filter(props.stops, segment => {
    return segment.stopIndex <= 1 || segment.timingStopType > 0;
  });

  const stopList = filteredStops.map(routeSegment => {
    return (
      <div className={styles.stop}>
        <p className={styles.stopName}>{routeSegment.stop.nameFi}</p>
        <p className={styles.stopName}>{routeSegment.stop.nameSe}</p>
      </div>
    );
  });

  return <div className={styles.headerContainer}>{stopList}</div>;
};

LineTableHeader.propTypes = {
  stops: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default LineTableHeader;
