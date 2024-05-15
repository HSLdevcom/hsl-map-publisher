import React from 'react';
import PropTypes from 'prop-types';
import { combineConsecutiveDays } from '../timetable/timetableContainer';
import { Column, Row, WrappingRow } from '../util';
import LineTableHeader from './lineTableHeader';
import styles from './lineTableColumns.css';
import classNames from 'classnames';

const LineTimetableRow = props => {
  const { hours, minutes } = props;
  const paddedMins = minutes.toString().padStart(2, '0');
  return (
    <WrappingRow>
      <Row className={styles.departureRow}>
        {hours}.{paddedMins}
      </Row>
    </WrappingRow>
  );
};

LineTimetableRow.propTypes = {
  hours: PropTypes.number.isRequired,
  minutes: PropTypes.number.isRequired,
};

const DeparturesColumn = props => {
  const { departures, stop } = props;

  if (departures) {
    const departureRows = departures.map(departure => (
      <LineTimetableRow hours={departure.hours} minutes={departure.minutes} />
    ));

    return (
      <div>
        <LineTableHeader stop={stop} />
        <div
          className={classNames(styles.departureRowContainer, {
            [styles.firstStopDivider]: stop.index === 0,
          })}>
          {departureRows}
        </div>
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
  const { showDivider } = props;

  const mapWeekdayDepartures = props.departures.map(departuresForStop => {
    const {
      mondays,
      tuesdays,
      wednesdays,
      thursdays,
      fridays,
      saturdays,
      sundays,
    } = departuresForStop.departures;

    return {
      stop: departuresForStop.stop,
      combinedDays: combineConsecutiveDays({
        mondays,
        tuesdays,
        wednesdays,
        thursdays,
        fridays,
        saturdays,
        sundays,
      }),
    };
  });

  const departureColums = mapWeekdayDepartures.map((departures, index) => {
    const hasDepartures = Object.keys(departures.combinedDays).length > 0;
    return (
      <div>
        {hasDepartures && (
          <Column
            className={classNames(styles.departureColumnContainer, {
              [styles.wider]: showDivider,
            })}>
            <DeparturesColumn
              departures={departures.combinedDays[selectedDepartureDays]}
              stop={{ ...departures.stop, index }}
            />
          </Column>
        )}
      </div>
    );
  });

  return <div className={styles.tableContainer}>{departureColums}</div>;
};

LineTableColumns.propTypes = {
  departures: PropTypes.arrayOf(PropTypes.any).isRequired,
  stopSequence: PropTypes.arrayOf(PropTypes.string).isRequired,
  days: PropTypes.string.isRequired,
  showDivider: PropTypes.bool.isRequired,
};

export default LineTableColumns;
