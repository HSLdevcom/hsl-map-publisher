import React from 'react';
import PropTypes from 'prop-types';
import { Row, WrappingRow } from 'components/util';
import sortBy from 'lodash/sortBy';
import keys from 'lodash/keys';
import pickBy from 'lodash/pickBy';
import { trimRouteId } from 'util/domain';
import classnames from 'classnames';
import TableHeader from '../timetable/tableHeader';
import RouteDiagram from 'components/routeDiagram/routeDiagramContainer';

import styles from './a3TableRows.css';

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

const TableRows = props => {
  // Split columns to multiple divs if there's a day divider.
  const indexesToSplit = keys(pickBy(props.departures, 'segment'));
  indexesToSplit.push(props.departures.length);
  const arrs = [];
  let startIndex = 0;
  indexesToSplit.forEach((splitIndex, index) => {
    const splitHere = parseInt(splitIndex, 10);
    const splitted = props.departures.slice(startIndex, splitHere);
    startIndex = splitIndex;
    arrs.push(splitted);
  });
  const diagramExists = keys(pickBy(props.departures, 'diagram'));
  if (diagramExists.length > 0) {
    arrs.push({ diagram: true });
  }
  const getRowAndHeader = (departuresHour, index) => (
    <div>
      {departuresHour.segment && (
        <div className={styles.a3tableHeaderContainer}>
          <TableHeader
            title={departuresHour.segment}
            subtitleSw="Lördag"
            subtitleEn="Saturday"
            printAsA3
          />
        </div>
      )}
      <TableRow
        key={`${departuresHour.hour}${index}`}
        hours={departuresHour.hour}
        departures={departuresHour.departures}
      />
    </div>
  );
  return (
    <div
      className={classnames(styles.a3container, {
        [styles.wide]: props.useWide,
        [styles.diagram]: diagramExists.length > 0,
      })}>
      {arrs.map(arr => {
        if (arr.diagram) {
          if (!props.diagram) {
            return null;
          }
          return (
            <RouteDiagram
              height={props.diagram.diagramOptions.diagramStopCount}
              stopIds={[props.diagram.stopId]}
              date={props.diagram.date}
              routeFilter={props.diagram.routeFilter}
              printAsA3={props.diagram.printAsA3}
            />
          );
        }
        const content = [];
        arr.forEach((departuresHour, index) => {
          if (departuresHour.hour) {
            content.push(getRowAndHeader(departuresHour, index));
          }
        });
        if (!!arr.length && !!content.length) {
          return <div className={styles.a3root}>{content}</div>;
        }
        return null;
      })}
    </div>
  );
};

TableRows.defaultProps = {
  diagram: null,
  useWide: false,
};

TableRows.propTypes = {
  departures: PropTypes.arrayOf(
    PropTypes.shape({
      hours: PropTypes.number.isRequired,
      ...Departure.propTypes,
    }),
  ).isRequired,
  diagram: PropTypes.object,
  useWide: PropTypes.bool,
};

export default TableRows;
