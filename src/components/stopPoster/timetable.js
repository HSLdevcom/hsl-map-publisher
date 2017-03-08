import React, { PropTypes } from "react";
import groupBy from "lodash/groupBy";
import { Row, WrappingRow, Spacer } from "components/util";
import CustomTypes from "util/customTypes";

import styles from "./timetable.css";

const Header = props => (
    <div className={styles.header}>
        <div className={styles.title}>
            <strong>{props.title_fi}</strong>
            &nbsp;&nbsp;
            {props.title_se}
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
    title_fi: PropTypes.string.isRequired,
    title_se: PropTypes.string.isRequired,
};

const Departure = props => (
    <div className={styles.item}>
        <strong>{props.minutes < 10 && "0"}{props.minutes}</strong>/{props.routeId}
        {!props.isAccessible && "e"}
        {props.isFridayOnly && "pe"}
    </div>
);

Departure.propTypes = CustomTypes.departure;

const TableRow = props => (
    <Row>
        <div className={styles.itemPadded}>
            <strong>{props.hours < 10 && "0"}{props.hours}</strong>
        </div>
        <WrappingRow>
            {props.departures
                .sort((a, b) => a.minutes > b.minutes)
                .map((departure, index) => <Departure key={index} {...departure}/>)}
        </WrappingRow>
    </Row>
);

TableRow.propTypes = {
    hours: React.PropTypes.number.isRequired,
    departures: React.PropTypes.arrayOf(React.PropTypes.shape(CustomTypes.departure)).isRequired,
};

const Table = (props) => {
    const departuresByHour = groupBy(props.departures, "hours");
    // Sort hours from 5 to 4
    const sortValue = value => (value + 19) % 24;
    const sortedHours = Object.keys(departuresByHour)
        .map(hours => parseInt(hours, 10))
        .sort((hours, other) => sortValue(hours) - sortValue(other));

    return (
        <div className={styles.table}>
            {sortedHours.map(hours => (
                <TableRow key={hours} hours={hours} departures={departuresByHour[hours]}/>
            ))}
        </div>
    );
};

Table.propTypes = {
    departures: React.PropTypes.arrayOf(React.PropTypes.shape(CustomTypes.departure)),
};

const Timetable = props => (
    <div className={styles.root}>
        {!!props.weekdays.length &&
            <div>
                <Header title_fi="Maanantai - Perjantai" title_se="Måndag - Fredag"/>
                <Table departures={props.weekdays}/>
            </div>
        }
        {!!props.saturdays.length &&
            <div>
                <Header title_fi="Lauantai" title_se="Lördag"/>
                <Table departures={props.saturdays}/>
            </div>
        }
        {!!props.sundays.length &&
            <div>
                <Header title_fi="Sunnuntai" title_se="Sondag"/>
                <Table departures={props.sundays}/>
            </div>
        }
        <Spacer height={20}/>
        <div className={styles.footnote}>
            e = ei matalalattia-ajoneuvo
        </div>
        <div className={styles.footnote}>
            pe = vain perjantaisin
        </div>
    </div>
);

Timetable.propTypes = {
    weekdays: React.PropTypes.arrayOf(React.PropTypes.shape(CustomTypes.departure)),
    saturdays: React.PropTypes.arrayOf(React.PropTypes.shape(CustomTypes.departure)),
    sundays: React.PropTypes.arrayOf(React.PropTypes.shape(CustomTypes.departure)),
};

export default Timetable;
