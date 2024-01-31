import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { chunk, last, groupBy, findIndex } from 'lodash';
import renderQueue from 'util/renderQueue';

import TableRows from './a3TableRows';
import SimpleRoutes from '../timetable/simpleRoutes';
import styles from './a3Timetable.css';

const COLUMNS_PER_PAGE = 3;
const MAX_DIAGRAM_RETRIES = 3;
const PAGE_HEIGHT = 840;
const SINGLE_COLUMN_MIN_DEPARTURES = 200;
const SEGMENT_NAMES = {
  weekdays: 'Maanantai - Perjantai',
  saturdays: 'Lauantai',
  sundays: 'Sunnuntai',
};

class Timetable extends Component {
  constructor(props) {
    super(props);

    this.onError = this.onError.bind(this);

    this.state = {
      weekdays: {
        removedRows: [],
        groupedRows: [],
      },
      diagramRetries: this.props.groupedRows ? MAX_DIAGRAM_RETRIES : 0,
    };
  }

  componentWillMount() {
    renderQueue.add(this);
  }

  componentDidMount() {
    let departures = [];
    const weekdays = this.rowsByHour(this.props.weekdays);
    const saturdays = this.rowsByHour(this.props.saturdays);
    const sundays = this.rowsByHour(this.props.sundays);

    if (weekdays.length > 0) {
      weekdays[0].segment = SEGMENT_NAMES.weekdays;
    }
    if (saturdays.length > 0) {
      saturdays[0].segment = SEGMENT_NAMES.saturdays;
    }
    if (sundays.length > 0) {
      sundays[0].segment = SEGMENT_NAMES.sundays;
    }
    departures = this.props.groupedRows
      ? this.props.groupedRows
      : this.defaultColumns({ weekdays, saturdays, sundays });

    this.setState({
      weekdays: {
        removedRows: [],
        groupedRows: departures,
      },
    });
    renderQueue.onEmpty(error => !error && this.updateLayout(), {
      ignore: this,
    });
  }

  componentDidUpdate() {
    window.setTimeout(() => {
      renderQueue.onEmpty(error => !error && this.updateLayout(), {
        ignore: this,
      });
    }, 50);
  }

  onError(error) {
    renderQueue.remove(this, { error: new Error(error) });
  }

  defaultColumns = props => {
    const { weekdays, saturdays, sundays } = props;
    const segments = [weekdays, saturdays, sundays];
    const departuresLength = segments
      .flat()
      .reduce((acc, element) => acc + element.departures.length, 0);
    const useSingleColumn = departuresLength < SINGLE_COLUMN_MIN_DEPARTURES;
    let departures = [];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (segment.length > 0) {
        if (useSingleColumn) {
          departures = departures.concat(segment);
        } else {
          departures.push(segment);
        }
      }
    }

    return useSingleColumn ? [departures] : departures;
  };

  getZoneLetterStyle = zone => ({
    transform:
      zone === 'B'
        ? 'translate(calc(-50%), calc(-50% + 2px))'
        : zone === 'C'
        ? 'translate(calc(-50% - 2px), calc(-50% + 2px))'
        : zone === 'D'
        ? 'translate(calc(-50% + 2px), calc(-50% + 2px))'
        : 'translate(-50%, -50%)', // No px adjustments for zone A and the "else" case.
  });

  getNotes = (notes, symbols) => {
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

  nullOrEmpty = arr => !arr || arr.length === 0;

  rowsByHour = rowDepartures => {
    const departuresByHour = groupBy(
      rowDepartures,
      departure => (departure.isNextDay ? 24 : 0) + departure.hours,
    );
    const rows = Object.entries(departuresByHour).map(([hours, departures]) => ({
      hour: hours,
      departures,
    }));

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

    const formatHour = hour => `${hour % 24 < 10 ? '0' : ''}${hour % 24}`;

    const getDuplicateCutOff = (startIndex, rowArray) => {
      const startRow = rowArray[startIndex];
      let cutOffIndex = startIndex;
      for (let i = startIndex; i < rowArray.length; i++) {
        const cur = rowArray[i];
        if (!isEqualDepartureHour(startRow.departures, cur.departures)) {
          return cutOffIndex;
        }
        cutOffIndex = i;
      }
      return cutOffIndex;
    };

    const rowsByHourArr = [];
    for (let i = 0; i < rows.length; i++) {
      const cutOff = getDuplicateCutOff(i, rows);
      const hours =
        rows[i].hour === rows[cutOff].hour
          ? `${formatHour(rows[i].hour)}`
          : `${formatHour(rows[i].hour)}-${formatHour(rows[cutOff].hour)}`;
      rowsByHourArr.push({
        hour: hours,
        departures: rows[i].departures,
      });
      i = cutOff;
    }
    return rowsByHourArr;
  };

  hasOverflow() {
    if (!this.content) {
      console.log('no content');
      return false;
    }

    return {
      horizontal: this.content.scrollWidth > this.content.clientWidth,
      vertical: this.content.scrollHeight > this.content.clientHeight,
    };
  }

  updateLayout() {
    const overflow = this.hasOverflow();
    const { weekdays } = this.state;
    const { groupedRows, removedRows } = weekdays;
    let { diagramRetries } = this.state;
    // True if no overflows, departures exist in grouped rows and no removed rows to add as new column
    const allOk =
      !overflow.vertical &&
      !overflow.horizontal &&
      weekdays.removedRows.length === 0 &&
      weekdays.groupedRows.length > 0;

    // If diagram retries reach maximum remove diagram and empty columns
    if (this.state.diagramRetries > MAX_DIAGRAM_RETRIES) {
      while (last(groupedRows).length === 0) {
        groupedRows.pop();
        weekdays.groupedRows = groupedRows;
      }

      while (last(groupedRows)[0].emptyColumn) {
        groupedRows.pop();
        weekdays.groupedRows = groupedRows;
      }
      while (true) {
        const lastGroupedRows = last(groupedRows);
        const lastRow = last(lastGroupedRows);
        if (lastRow && lastRow.diagram) {
          lastGroupedRows.pop();
          groupedRows[groupedRows.length - 1] = lastGroupedRows;
          weekdays.groupedRows = groupedRows;
        } else {
          break;
        }
      }
      renderQueue.remove(this);
      this.props.updateHook(weekdays.groupedRows);
      return;
    }

    // If everything ok and using diagram remove process from queue and return
    if (allOk && this.state.useDiagram) {
      renderQueue.remove(this);
      this.props.updateHook(weekdays.groupedRows);
      return;
    }

    // Fix vertical overflow by removing rows and adding them to removed rows list. Removed rows list will be added in as new column.
    if (overflow.horizontal || overflow.vertical) {
      const lastGroupedRows = groupedRows.pop();
      const removedRow = lastGroupedRows.pop();

      // if is diagram and diagramRetries is maxed dont remove last row
      if (lastGroupedRows.length > 0) {
        groupedRows.push(lastGroupedRows);
      }
      if (removedRow && removedRows) {
        removedRows.push(removedRow);
      }

      // If overflowing element is diagram add empty columns to trigger next page
      if (removedRow && removedRow.diagram) {
        removedRows.push({ emptyColumn: true });
        diagramRetries += 1;
      }
      this.setState({
        weekdays: {
          removedRows,
          groupedRows,
        },
        diagramRetries,
      });
      return;
    }
    // Add removed rows as new column
    if (removedRows.length > 0) {
      const newGroupedRow = removedRows.reverse();
      groupedRows.push(newGroupedRow);
      this.setState({
        weekdays: {
          removedRows: [],
          groupedRows,
        },
      });
      return;
    }
    // After departure overflows are fixed, add last row as diagram. It will be parsed in a3TableRows as a special case.
    if (
      !overflow.vertical &&
      weekdays.removedRows.length === 0 &&
      weekdays.groupedRows.length > 0 &&
      !this.state.useDiagram &&
      this.state.diagramRetries < MAX_DIAGRAM_RETRIES
    ) {
      const lastGroupedRows = last(groupedRows);
      const lastRow = last(lastGroupedRows);
      // Adding last row as diagram. It will be parsed in a3TableRows as a special case.
      if (lastRow && !lastRow.diagram) {
        groupedRows[groupedRows.length - 1].push({ diagram: true });
      }
      weekdays.groupedRows = groupedRows;
      this.setState({
        useDiagram: true,
        weekdays,
      });
    }
  }

  render() {
    const allNullOrEmpty =
      this.nullOrEmpty(this.props.weekdays) &&
      this.nullOrEmpty(this.props.saturdays) &&
      this.nullOrEmpty(this.props.sundays);
    if (allNullOrEmpty) {
      return null;
    }
    const weekdaysRows = this.rowsByHour(this.state.weekdays);
    const chunkedRows = chunk(this.state.weekdays.groupedRows, COLUMNS_PER_PAGE);
    // Header is excluded from first page.
    const contentContainerStyle = { height: PAGE_HEIGHT - 97 };
    // ChunkedRow is 3 columns and 3 colums is the maximum for one page. If more
    // than 3 colums we need to increase height so rest of the timetable rows can fit.
    // After first page the height is increased by one A3 page height.
    if (chunkedRows.length > 1) {
      const extraHeight = (chunkedRows.length - 1) * PAGE_HEIGHT;
      contentContainerStyle.height += extraHeight;
    }
    return (
      <div
        className={classNames(styles.root, {
          [styles.summer]: this.props.isSummerTimetable,
          [styles.a3]: true,
          [styles.standalone]: this.props.standalone,
          [styles.greyscale]: this.props.greyscale,
        })}>
        {this.props.standalone && (
          <React.Fragment>
            <div className={styles.stopZone}>
              <div className={styles.zoneTitle}>Vyöhyke</div>
              <div className={styles.zoneSubtitle}>Zon/Zone</div>
              <div className={styles.zone}>
                <span
                  className={styles.zoneLetter}
                  style={this.getZoneLetterStyle(this.props.stopZone)}>
                  {this.props.stopZone}
                </span>
              </div>
            </div>
            <SimpleRoutes stopId={this.props.stopId} date={this.props.date} />
          </React.Fragment>
        )}

        {weekdaysRows.length > 0 && (
          <div
            className={styles.tableContentContainer}
            style={contentContainerStyle}
            ref={ref => {
              this.content = ref;
            }}>
            {chunkedRows.map((chunkedRow, index) => {
              // Use wider timetable columns:
              // - If last column is an empty column
              // - If three columns and last one is empty
              // - If less than three columns and diagram is next to be added
              const lastOnPage = last(last(chunkedRow));
              let useWide =
                lastOnPage.emptyColumn ||
                (chunkedRow.length === COLUMNS_PER_PAGE && last(chunkedRow).length === 0) ||
                (chunkedRow.length < COLUMNS_PER_PAGE && lastOnPage && lastOnPage.diagram);

              const flatChunkedRow = chunkedRow.flat();
              const hasDiagram = findIndex(flatChunkedRow, { diagram: true }) !== -1;

              // No wide columns when diagram on same page
              if (hasDiagram) {
                useWide = false;
              }

              return (
                <div className={styles.tableRowsContainer}>
                  {chunkedRow.map(rows => (
                    <TableRows
                      diagram={this.props.diagram}
                      departures={rows}
                      useWide={useWide}
                      isSummerTimetable={this.props.isSummerTimetable}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* {this.props.showNotes && this.props.notes.length !== 0 && <Spacer height={20} />}
        {this.props.showNotes &&
          this.getNotes(this.props.notes, this.props.specialSymbols).map(note => (
            <div key={note} className={styles.footnote}>
              {note}
            </div>
          ))} */}
      </div>
    );
  }
}

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
  diagram: {},
  groupedRows: null,
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
  diagram: PropTypes.object,
  groupedRows: PropTypes.array,
  updateHook: PropTypes.func.isRequired,
};

export default Timetable;
