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
    {trimRouteId(props.routeId, true)}
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
    <div className={styles.hours}>{props.hours}</div>
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

const isEqualDepartureHour = (a, b) => {
  if (!a || !b) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    const curA = a[i];
    const curB = b[i];

    if (!curA || !curB) {
      return false;
    }

    if (curA.minutes !== curB.minutes) {
      return false;
    }
    if (curA.note !== curB.note) {
      return false;
    }
  }
  return true;
};

const getDuplicateCutOff = (startIndex, rows) => {
  const startRow = rows[startIndex];
  let cutOffIndex = startIndex;
  for (let i = startIndex; i < rows.length; i++) {
    const cur = rows[i];
    if (!isEqualDepartureHour(startRow.departures, cur.departures)) {
      return cutOffIndex;
    }
    cutOffIndex = i;
  }
  return cutOffIndex;
};

const TableRows = props => {
  const departuresByHour = groupBy(
    props.departures,
    departure => (departure.isNextDay ? 24 : 0) + departure.hours,
  );
  const rows = Object.entries(departuresByHour).map(([hours, departures]) => ({
    hour: hours,
    departures,
  }));

  const formatHour = hour => `${hour % 24 < 10 ? '0' : ''}${hour % 24}`;

  const rowsByHour = [];
  for (let i = 0; i < rows.length; i++) {
    const cutOff = getDuplicateCutOff(i, rows);
    const hours =
      rows[i].hour === rows[cutOff].hour
        ? `${formatHour(rows[i].hour)}`
        : `${formatHour(rows[i].hour)}-${formatHour(rows[cutOff].hour)}`;
    rowsByHour.push({
      hour: hours,
      departures: rows[i].departures,
    });
    i = cutOff;
  }

  return (
    <div className={styles.root}>
      {rowsByHour.map((departuresHour, index) => (
        <TableRow
          key={`${index}_${departuresHour.hour}`}
          hours={departuresHour.hour}
          departures={departuresHour.departures}
        />
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
