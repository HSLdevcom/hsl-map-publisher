import React from 'react';
import PropTypes from 'prop-types';
import { Column, Row, WrappingRow } from '../util';
import LineTableHeader from './lineTableHeader';
import styles from './lineTableColumns.css';
import classNames from 'classnames';
import { isArray, filter, isEmpty, groupBy } from 'lodash';
import { filterDuplicateDepartureHours, getDuplicateCutOff } from '../timetable/tableRows';

const LineTimetableRow = props => {
  const { hour, departures } = props;
  const sortedMinuteDepartures = departures.sort((a, b) => {
    return a.minutes - b.minutes;
  });
  return (
    <WrappingRow>
      <Row className={styles.departureRow}>
        <div className={styles.hour}>{hour}</div>
        <div className={styles.minutesContainer}>
          {sortedMinuteDepartures.map((departure, index) => (
            <div className={styles.minutes} key={index}>
              {departure.note === 'p'
                ? `${departure.minutes.toString().padStart(2, '0')}pe`
                : departure.minutes.toString().padStart(2, '0')}
            </div>
          ))}
        </div>
      </Row>
    </WrappingRow>
  );
};

LineTimetableRow.propTypes = {
  hour: PropTypes.number.isRequired,
  departures: PropTypes.array.isRequired,
};

const DeparturesColumn = props => {
  const { departures, stop } = props;

  if (departures) {
    const departuresByHour = groupBy(
      departures,
      departure => (departure.isNextDay ? 24 : 0) + departure.hours,
    );

    const rows = Object.entries(departuresByHour).map(([hours, hourlyDepartures]) => ({
      hour: hours,
      departures: hourlyDepartures,
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

    const departureRows = filteredDepartures.map(hourlyDepartures => {
      return (
        <LineTimetableRow hour={hourlyDepartures.hour} departures={hourlyDepartures.departures} />
      );
    });

    return (
      <div>
        <LineTableHeader stop={stop} />
        <div className={styles.departureRowContainer}>{departureRows}</div>
      </div>
    );
  }

  return (
    <div>
      <LineTableHeader stop={stop} />
    </div>
  );
};

DeparturesColumn.propTypes = {
  departures: PropTypes.array.isRequired,
  stop: PropTypes.object.isRequired,
};

const LineTableColumns = props => {
  const selectedDepartureDays = props.days;
  const { showDivider, departuresByStop } = props;

  const departureColums = departuresByStop.map((departures, index) => {
    if (isArray(selectedDepartureDays)) {
      const validSelectedDay = filter(selectedDepartureDays, departureDay => {
        return !isEmpty(departures.combinedDays[departureDay]);
      });
      return (
        <div>
          <Column
            className={classNames(styles.departureColumnContainer, {
              [styles.wider]: showDivider,
            })}>
            <DeparturesColumn
              departures={departures.combinedDays[validSelectedDay]}
              stop={{ ...departures.stop, index }}
            />
          </Column>
        </div>
      );
    }
    return (
      <div>
        <Column
          className={classNames(styles.departureColumnContainer, {
            [styles.wider]: showDivider,
          })}>
          <DeparturesColumn
            departures={departures.combinedDays[selectedDepartureDays]}
            stop={{ ...departures.stop, index }}
          />
        </Column>
      </div>
    );
  });

  return <div className={styles.tableContainer}>{departureColums}</div>;
};

LineTableColumns.propTypes = {
  departuresByStop: PropTypes.arrayOf(PropTypes.any).isRequired,
  stopSequence: PropTypes.arrayOf(PropTypes.string).isRequired,
  days: PropTypes.string.isRequired,
  showDivider: PropTypes.bool.isRequired,
};

export default LineTableColumns;
