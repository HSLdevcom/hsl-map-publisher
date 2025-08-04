import React from 'react';
import PropTypes from 'prop-types';
import groupBy from 'lodash/groupBy';
import { Row, WrappingRow } from 'components/util';
import sortBy from 'lodash/sortBy';
import { trimRouteId } from 'util/domain';
import { uniqBy } from 'lodash';
import classNames from 'classnames';

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
  <Row className={classNames({ [styles.compactRow]: props.useCompactLayout })}>
    <div className={styles.hours}>{props.hours}</div>
    <WrappingRow>
      {sortBy(props.departures, a => a.minutes).map((departure, index) => (
        <Departure key={index} {...departure} />
      ))}
    </WrappingRow>
  </Row>
);

TableRow.defaultProps = {
  useCompactLayout: false,
};

TableRow.propTypes = {
  hours: PropTypes.string.isRequired,
  departures: PropTypes.arrayOf(PropTypes.shape(Departure.propTypes)).isRequired,
  useCompactLayout: PropTypes.bool,
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

    if (curA.routeId !== curB.routeId) {
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

const isCutOffValid = (rows, startIndex, cutOffIndex) => {
  let isValid = true;

  const startingHour = Number(rows[startIndex].hour);
  const cutOffHour = Number(rows[cutOffIndex].hour);

  for (let i = startingHour; i < cutOffHour; i++) {
    const hourDepartures = rows.filter(row => Number(row.hour) === i);
    if (hourDepartures.length === 0) {
      isValid = false;
    }
  }
  return isValid;
};

export const getDuplicateCutOff = (startIndex, rows) => {
  const startRow = rows[startIndex];
  let cutOffIndex = startIndex;
  for (let i = startIndex; i < rows.length; i++) {
    const cur = rows[i];
    if (!isEqualDepartureHour(startRow.departures, cur.departures)) {
      return cutOffIndex;
    }
    cutOffIndex = i;
  }
  if (isCutOffValid(rows, startIndex, cutOffIndex)) {
    return cutOffIndex;
  }

  let newCutOffIndex = cutOffIndex;

  // Roll back the cutoff hour until the result is a valid cutoff
  while (!isCutOffValid(rows, startIndex, newCutOffIndex)) {
    newCutOffIndex--;
  }

  return newCutOffIndex;
};

export const filterDuplicateDepartureHours = departureRows => {
  return uniqBy(departureRows, 'departures');
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
    let hours =
      rows[i].hour === rows[cutOff].hour
        ? `${formatHour(rows[i].hour)}`
        : `${formatHour(rows[i].hour)}-${formatHour(rows[cutOff].hour)}`;
    if (rows.length === 2) {
      hours = `${formatHour(rows[i].hour)}`;
      const firstHour = { hour: hours, departures: rows[i].departures };
      const secondHour = {
        hour: `${formatHour(rows[rows.length - 1].hour)}`,
        departures: rows[rows.length - 1].departures,
      };

      rowsByHour.push(firstHour, secondHour);
      i = cutOff;
    } else {
      rowsByHour.push({
        hour: hours,
        departures: rows[i].departures,
      });
      i = cutOff;
    }
  }

  const filteredDepartures = filterDuplicateDepartureHours(rowsByHour);
  const useCompactLayout = true;

  return (
    <div className={styles.root}>
      {filteredDepartures.map(departuresHour => (
        <TableRow
          key={`${departuresHour.hour}${departuresHour.departures}`}
          hours={departuresHour.hour}
          departures={departuresHour.departures}
          useCompactLayout={useCompactLayout}
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
