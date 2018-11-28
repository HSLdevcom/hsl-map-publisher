import React from 'react';
import PropTypes from 'prop-types';
import groupBy from 'lodash/groupBy';
import { Row, WrappingRow } from 'components/util';
import sortBy from 'lodash/sortBy';
import { trimRouteId } from 'util/domain';

import styles from './tableRows.css';

const Departure = props => (
  <div className={styles.item}>
    <div className={styles.minutes}>
      {props.minutes < 10 && '0'}
      {props.minutes}
    </div>
    /&#x202F;
    {trimRouteId(props.routeId)}
    {props.note}
  </div>
);

Departure.defaultProps = {
  note: null,
};

Departure.propTypes = {
  minutes: PropTypes.number.isRequired,
  note: PropTypes.string,
};

const TableRow = props => (
  <Row>
    <div className={styles.hours}>
      {props.hours % 24 < 10 && '0'}
      {props.hours % 24}
    </div>
    <WrappingRow>
      {sortBy(props.departures, a => a.minutes).map((departure, index) => (
        <Departure key={index} {...departure} />
      ))}
    </WrappingRow>
  </Row>
);

TableRow.propTypes = {
  hours: PropTypes.string.isRequired,
  departures: PropTypes.arrayOf(PropTypes.shape(Departure.propTypes)).isRequired,
};

const TableRows = props => {
  const departuresByHour = groupBy(
    props.departures,
    departure => (departure.isNextDay ? 24 : 0) + departure.hours,
  );

  return (
    <div className={styles.root}>
      {Object.entries(departuresByHour).map(([hours, departures]) => (
        <TableRow key={hours} hours={hours} departures={departures} />
      ))}
    </div>
  );
};

TableRows.propTypes = {
  departures: PropTypes.arrayOf(
    PropTypes.shape({
      hours: PropTypes.number.isRequired,
      ...Departure.propTypes,
    }),
  ).isRequired,
};

export default TableRows;
