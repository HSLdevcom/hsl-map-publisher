import React from "react";
import PropTypes from "prop-types";
import groupBy from "lodash/groupBy";
import { Row, WrappingRow, Spacer } from "components/util";
import sortBy from "lodash/sortBy";
import classNames from "classnames";
import { trimRouteId } from "util/domain";

import styles from "./timetable.css";

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
            {sortBy(props.departures, a => a.minutes).map((departure, index) => (
                <Departure key={index} {...departure}/>
            ))}
        </WrappingRow>
    </Row>
);


TableRow.propTypes = {
    hours: PropTypes.string.isRequired,
    departures: PropTypes.arrayOf(PropTypes.shape(Departure.propTypes)).isRequired,
};

const Table = (props) => {
    const departuresByHour = groupBy(
        props.departures,
        departure => (departure.isNextDay ? 24 : 0) + departure.hours
    );

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
        {props.showComponentName &&
            <div className={styles.componentName}>
                <div className={styles.title}>
                    Pysäkkiaikataulu&nbsp;&nbsp;
                </div>
                <div className={styles.subtitle}>
                    Hållplatstidtabell
                </div>
            </div>
        }
        {props.showValidityPeriod &&
            <div className={styles.validity}>
                <div><strong>Aikataulut voimassa</strong></div>
                <div>Tidtabeller giltiga</div>
                <div>
                    {new Date(props.dateBegin).toLocaleDateString("fi")}
                    &nbsp;-&nbsp;
                    {new Date(props.dateEnd).toLocaleDateString("fi")}
                </div>
            </div>
        }
        {props.weekdays && props.weekdays.length > 0 &&
            <div>
                <Header titleFi="Maanantai - Perjantai" titleSe="Måndag - Fredag"/>
                <Table departures={props.weekdays}/>
            </div>
        }
        {props.saturdays && props.saturdays.length > 0 &&
            <div>
                <Header titleFi="Lauantai" titleSe="Lördag"/>
                <Table departures={props.saturdays}/>
            </div>
        }
        {props.sundays && props.sundays.length > 0 &&
            <div>
                <Header titleFi="Sunnuntai" titleSe="Söndag"/>
                <Table departures={props.sundays}/>
            </div>
        }
        {props.showNotes && props.notes.length !== 0 && <Spacer height={20}/>}
        {props.showNotes && props.notes.map(note => (
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
};

Timetable.propTypes = {
    weekdays: PropTypes.arrayOf(PropTypes.shape(Table.propTypes.departures)),
    saturdays: PropTypes.arrayOf(PropTypes.shape(Table.propTypes.departures)),
    sundays: PropTypes.arrayOf(PropTypes.shape(Table.propTypes.departures)),
    notes: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    isSummerTimetable: PropTypes.bool,
    showValidityPeriod: PropTypes.bool,
    showNotes: PropTypes.bool,
    dateBegin: PropTypes.string.isRequired,
    dateEnd: PropTypes.string.isRequired,
    showComponentName: PropTypes.bool,
};

export default Timetable;
