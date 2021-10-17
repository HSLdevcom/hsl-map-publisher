import React from 'react';
import PropTypes from 'prop-types';
import { Spacer } from 'components/util';
import classNames from 'classnames';

import TableHeader from './tableHeader';
import TableRows from './tableRows';
import SimpleRoutes from './simpleRoutes';
import styles from './timetable.css';

const formatDate = date => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  return `${day} ${monthNames[monthIndex]} ${year}`;
};

const getZoneLetterStyle = zone => ({
  transform:
    zone === 'B'
      ? 'translate(calc(-50%), calc(-50% + 2px))'
      : zone === 'C'
      ? 'translate(calc(-50% - 2px), calc(-50% + 2px))'
      : zone === 'D'
      ? 'translate(calc(-50% + 2px), calc(-50% + 2px))'
      : 'translate(-50%, -50%)', // No px adjustments for zone A and the "else" case.
});

const getNotes = (notes, symbols) => {
  const parsedNotes = [];
  symbols.forEach(symbol => {
    notes.forEach(note => {
      if (note.substring(0, symbol.length) === symbol && !parsedNotes.includes(note)) {
        parsedNotes.push(note);
      }
    });
  });
  return parsedNotes;
};

const nullOrEmpty = arr => !arr || arr.length === 0;

const Timetable = props => {
  const allNullOrEmpty =
    nullOrEmpty(props.weekdays) && nullOrEmpty(props.saturdays) && nullOrEmpty(props.sundays);
  if (allNullOrEmpty) {
    return null;
  }
  return (
    <div
      className={classNames(styles.root, {
        [styles.summer]: props.isSummerTimetable,
        [styles.a3]: props.printAsA3,
        [styles.printable]: props.printableAsA4,
        [styles.standalone]: props.standalone,
        [styles.greyscale]: props.greyscale,
      })}>
      {!props.printAsA3 && (
        <div className={styles.header}>
          {props.showStopInformation && (
            <div className={styles.headerTitle}>
              <div className={styles.title}>
                {props.stopNameFi}
                &nbsp;&nbsp;
              </div>
              <div className={styles.subtitle}>{props.stopNameSe}</div>
            </div>
          )}
          {props.showValidityPeriod && (
            <div className={styles.validity}>
              <div className={styles.shortId}>
                {props.stopShortId && `${props.stopShortId.replace(/\s+/g, '')}`}
              </div>
              <div className={styles.title}>Aikataulut voimassa</div>
              <div>Tidtabeller giltiga/Timetables valid</div>
              <div>
                {new Date(props.dateBegin).toLocaleDateString('fi')}
                &nbsp;-&nbsp;
                {new Date(props.dateEnd).toLocaleDateString('fi')}
              </div>
              <div>
                {formatDate(new Date(props.dateBegin))}
                &nbsp;-&nbsp;
                {formatDate(new Date(props.dateEnd))}
              </div>
            </div>
          )}
        </div>
      )}
      {!props.printAsA3 && props.showComponentName && (
        <div className={styles.componentName}>
          <div className={styles.title}>Pysäkkiaikataulu&nbsp;&nbsp;</div>
          <div className={styles.subtitle}>Hållplatstidtabell</div>
          <div className={styles.subtitle}>Stop timetable</div>
        </div>
      )}
      {props.standalone && (
        <React.Fragment>
          <div className={styles.stopZone}>
            <div className={styles.zoneTitle}>Vyöhyke</div>
            <div className={styles.zoneSubtitle}>Zon/Zone</div>
            <div className={styles.zone}>
              <span className={styles.zoneLetter} style={getZoneLetterStyle(props.stopZone)}>
                {props.stopZone}
              </span>
            </div>
          </div>
          <SimpleRoutes stopId={props.stopId} date={props.date} />
        </React.Fragment>
      )}
      {props.weekdays && props.weekdays.length > 0 && (
        <div>
          <TableHeader
            title="Maanantai - Perjantai"
            subtitleSw="Måndag - Fredag"
            subtitleEn="Monday - Friday"
            printingAsA4={props.printableAsA4}
            printAsA3={props.printAsA3}
          />
          <TableRows departures={props.weekdays} printAsA3={props.printAsA3} />
        </div>
      )}
      {props.saturdays && props.saturdays.length > 0 && (
        <div>
          <TableHeader
            title="Lauantai"
            subtitleSw="Lördag"
            subtitleEn="Saturday"
            printingAsA4={props.printableAsA4}
            printAsA3={props.printAsA3}
          />
          <TableRows departures={props.saturdays} printAsA3={props.printAsA3} />
        </div>
      )}
      {props.sundays && props.sundays.length > 0 && (
        <div>
          <TableHeader
            title="Sunnuntai"
            subtitleSw="Söndag"
            subtitleEn="Sunday"
            printingAsA4={props.printableAsA4}
            printAsA3={props.printAsA3}
          />
          <TableRows departures={props.sundays} printAsA3={props.printAsA3} />
        </div>
      )}
      {props.showNotes && props.notes.length !== 0 && <Spacer height={20} />}
      {props.showNotes &&
        getNotes(props.notes, props.specialSymbols).map(note => (
          <div key={note} className={styles.footnote}>
            {note}
          </div>
        ))}
    </div>
  );
};

Timetable.defaultProps = {
  weekdays: null,
  saturdays: null,
  sundays: null,
  isSummerTimetable: false,
  showValidityPeriod: true,
  showNotes: true,
  showComponentName: true,
  printableAsA4: false,
  standalone: false,
  greyscale: false,
  specialSymbols: [],
  printAsA3: false,
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
  stopId: PropTypes.string.isRequired,
  stopZone: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  stopNameFi: PropTypes.string.isRequired,
  stopNameSe: PropTypes.string.isRequired,
  standalone: PropTypes.bool,
  greyscale: PropTypes.bool,
  specialSymbols: PropTypes.array,
  printAsA3: PropTypes.bool,
};

export default Timetable;
