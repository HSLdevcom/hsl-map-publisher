import React from 'react';
import PropTypes from 'prop-types';
import { Spacer } from 'components/util';
import classNames from 'classnames';

import TableHeader from './tableHeader';
import TableRows from './tableRows';

import styles from './timetable.css';

const Timetable = props => (
  <div
    className={classNames(styles.root, {
      [styles.summer]: props.isSummerTimetable,
      [styles.printable]: props.printableAsA4,
      [styles.greyscale]: props.greyscale,
    })}>
    {props.showStopInformation && (
      <div className={styles.componentName}>
        <div className={styles.title}>
          {props.stopNameFi}{' '}
          {props.stopShortId && `(${props.stopShortId.replace(/\s+/g, '')})`}{' '}
          &nbsp;&nbsp;
        </div>
        <div className={styles.subtitle}>{props.stopNameSe}</div>
      </div>
    )}
    {props.showComponentName && (
      <div className={styles.componentName}>
        <div className={styles.title}>Pysäkkiaikataulu&nbsp;&nbsp;</div>
        <div className={styles.subtitle}>Hållplatstidtabell</div>
      </div>
    )}
    {props.showValidityPeriod && (
      <div className={styles.validity}>
        <div>Aikataulut voimassa</div>
        <div>Tidtabeller giltiga</div>
        <div>
          {new Date(props.dateBegin).toLocaleDateString('fi')}
          &nbsp;-&nbsp;
          {new Date(props.dateEnd).toLocaleDateString('fi')}
        </div>
      </div>
    )}
    {props.weekdays &&
      props.weekdays.length > 0 && (
        <div>
          <TableHeader
            title="Maanantai - Perjantai"
            subtitle="Måndag - Fredag"
            printingAsA4={props.printableAsA4}
          />
          <TableRows departures={props.weekdays} />
        </div>
      )}
    {props.saturdays &&
      props.saturdays.length > 0 && (
        <div>
          <TableHeader
            title="Lauantai"
            subtitle="Lördag"
            printingAsA4={props.printableAsA4}
          />
          <TableRows departures={props.saturdays} />
        </div>
      )}
    {props.sundays &&
      props.sundays.length > 0 && (
        <div>
          <TableHeader
            title="Sunnuntai"
            subtitle="Söndag"
            printingAsA4={props.printableAsA4}
          />
          <TableRows departures={props.sundays} />
        </div>
      )}
    {props.showNotes && props.notes.length !== 0 && <Spacer height={20} />}
    {props.showNotes &&
      props.notes.map(note => (
        <div key={note} className={styles.footnote}>
          {note}
        </div>
      ))}
  </div>
);

Timetable.defaultProps = {
  weekdays: null,
  saturdays: null,
  sundays: null,
  isSummerTimetable: false,
  showValidityPeriod: true,
  showNotes: true,
  showComponentName: true,
  printableAsA4: false,
  greyscale: false,
};

Timetable.propTypes = {
  weekdays: PropTypes.arrayOf(PropTypes.shape(TableRows.propTypes.departures)),
  saturdays: PropTypes.arrayOf(PropTypes.shape(TableRows.propTypes.departures)),
  sundays: PropTypes.arrayOf(PropTypes.shape(TableRows.propTypes.departures)),
  notes: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  isSummerTimetable: PropTypes.bool,
  showValidityPeriod: PropTypes.bool,
  showNotes: PropTypes.bool,
  dateBegin: PropTypes.string.isRequired,
  dateEnd: PropTypes.string.isRequired,
  showComponentName: PropTypes.bool,
  showStopInformation: PropTypes.bool.isRequired,
  printableAsA4: PropTypes.bool,
  stopShortId: PropTypes.string.isRequired,
  stopNameFi: PropTypes.string.isRequired,
  stopNameSe: PropTypes.string.isRequired,
  greyscale: PropTypes.bool,
};

export default Timetable;
