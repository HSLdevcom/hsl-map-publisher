import React from 'react';
import PropTypes from 'prop-types';
import { Row, WrappingRow } from 'components/util';
import { sortBy, keys, pickBy, groupBy } from 'lodash';
import { trimRouteId } from 'util/domain';
import classnames from 'classnames';
import TableHeader from './a3TableHeader';
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

const SEGMENT_TEXTS = {
  'Maanantai - Perjantai': {
    sv: 'Måndag - Fredag',
    en: 'Monday - Friday',
  },
  Lauantai: {
    sv: 'Lördag',
    en: 'Saturday',
  },
  Sunnuntai: {
    sv: 'Söndag',
    en: 'Sunday',
  },
};

TableRow.propTypes = {
  hours: PropTypes.string.isRequired,
  departures: PropTypes.arrayOf(PropTypes.shape(Departure.propTypes)).isRequired,
};

const TableRows = props => {
  // Split columns to multiple divs if there's a day divider.
  const indexesToSplit = keys(pickBy(props.departures, 'segment'));
  const diagramExists = keys(pickBy(props.departures, 'diagram'));
  const departureSegments = [];
  indexesToSplit.push(props.departures.length);

  let startIndex = 0;
  indexesToSplit.forEach(splitIndex => {
    const splitHere = parseInt(splitIndex, 10);
    const departuresChunk = props.departures.slice(startIndex, splitHere);
    startIndex = splitIndex;
    departureSegments.push(departuresChunk);
  });

  if (diagramExists.length > 0) {
    departureSegments.push({ diagram: true });
  }
  const getRowAndHeader = (departuresHour, index) => (
    <div>
      {departuresHour.segment && (
        <div className={styles.a3tableHeaderContainer}>
          <TableHeader
            title={departuresHour.segment}
            subtitleSw={SEGMENT_TEXTS[departuresHour.segment].sv}
            subtitleEn={SEGMENT_TEXTS[departuresHour.segment].en}
            extended={props.useWide}
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
      {departureSegments.map((departureSegment, index) => {
        if (departureSegment.diagram) {
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
              useWide={props.useWide}
            />
          );
        }
        const content = [];
        departureSegment.forEach((departuresHour, i) => {
          if (departuresHour.hour) {
            content.push(getRowAndHeader(departuresHour, i));
          }
        });
        if (!!departureSegment.length && !!content.length) {
          return (
            <div
              key={`tableRows_${index}`}
              className={classnames(styles.a3root, {
                [styles.summer]: props.isSummerTimetable,
              })}>
              {content}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

TableRows.defaultProps = {
  diagram: null,
  useWide: false,
  isSummerTimetable: false,
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
  isSummerTimetable: PropTypes.bool,
};

export default TableRows;
