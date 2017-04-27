import React from "react";
import PropTypes from "prop-types";
import groupBy from "lodash/groupBy";
import { Row, WrappingRow, Spacer } from "components/util";
import sortBy from "lodash/sortBy";
import classNames from "classnames";

import styles from "./timetable.css";

import { trimRouteId } from "../../util/domain";

const Header = props => (
    <div className={styles.header}>
        <div className={styles.title}>
            <strong>{props.titleFi}</strong>
            &nbsp;&nbsp;
            {props.titleSe}
        </div>

        <div className={styles.subtitle}>
            <div><strong>Tunti</strong></div>
            <div><strong>min</strong> / linja Arvioidut ohitusajat</div>
        </div>

        <div className={styles.subtitle}>
            <div><strong>Timme</strong></div>
            <div><strong>min</strong> / linje Beräknade passertider</div>
        </div>
    </div>
);

Header.propTypes = {
    titleFi: PropTypes.string.isRequired,
    titleSe: PropTypes.string.isRequired,
};

const Departure = props => (
    <div className={styles.item}>
        <div className={styles.minutes}>{props.minutes < 10 && "0"}{props.minutes}</div>
        /&#x202F;
        {trimRouteId(props.routeId)}
        {!props.isAccessible && "e"}{props.note}
    </div>
);

Departure.propTypes = {
    minutes: PropTypes.number.isRequired,
    isAccessible: PropTypes.bool.isRequired,
    note: PropTypes.string,
};

Departure.defaultProps = { note: null };

const TableRow = props => (
    <Row>
        <div className={styles.itemPadded}>
            <strong>{(props.hours % 24) < 10 && "0"}{props.hours % 24}</strong>
        </div>
        <WrappingRow>
            {sortBy(props.departures, a => a.minutes)
                .map((departure, index) => <Departure key={index} {...departure}/>)}
        </WrappingRow>
    </Row>
);


TableRow.propTypes = {
    hours: PropTypes.string.isRequired,
    departures: PropTypes.arrayOf(PropTypes.shape(Departure.propTypes)).isRequired,
};

const Table = (props) => {
    const departuresByHour = groupBy(props.departures, departure =>
        (departure.isNextDay ? 24 : 0) + departure.hours);

    return (
        <div className={styles.table}>
            {Object.entries(departuresByHour).map(([hours, departures]) => (
                <TableRow key={hours} hours={hours} departures={departures}/>
            ))}
        </div>
    );
};

Table.propTypes = {
    departures: PropTypes.arrayOf(PropTypes.shape({
        hours: PropTypes.number.isRequired,
        ...Departure.propTypes,
    })).isRequired,
};

const Timetable = props => (
    <div className={classNames(styles.root, { [styles.summer]: props.isSummerTimetable })}>
        {!!props.weekdays.length &&
            <div>
                <Header titleFi="Maanantai - Perjantai" titleSe="Måndag - Fredag"/>
                <Table departures={props.weekdays}/>
            </div>
        }
        {!!props.saturdays.length &&
            <div>
                <Header titleFi="Lauantai" titleSe="Lördag"/>
                <Table departures={props.saturdays}/>
            </div>
        }
        {!!props.sundays.length &&
            <div>
                <Header titleFi="Sunnuntai" titleSe="Sondag"/>
                <Table departures={props.sundays}/>
            </div>
        }
        <Spacer height={20}/>
        {props.notes.map(note =>
            <div key={note} className={styles.footnote}>
                {note}
            </div>
        )}
    </div>
);

Timetable.propTypes = {
    weekdays: PropTypes.arrayOf(PropTypes.shape(Table.propTypes.departures)),
    saturdays: PropTypes.arrayOf(PropTypes.shape(Table.propTypes.departures)),
    sundays: PropTypes.arrayOf(PropTypes.shape(Table.propTypes.departures)),
    notes: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    isSummerTimetable: PropTypes.bool,
};

Timetable.defaultProps = {
    weekdays: null,
    saturdays: null,
    sundays: null,
    isSummerTimetable: false,
};

export default Timetable;
