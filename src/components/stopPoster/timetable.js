import React from "react";
import groupBy from "lodash/groupBy";
import { Row, WrappingRow } from "components/util";

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

const Departure = props => (
    <div className={styles.item}>
        <strong>{props.minutes < 10 && "0"}{props.minutes}</strong>/{props.routeId}
        {!props.isAccessible && "e"}
        {props.isFridayOnly && "pe"}
    </div>
);

const DepartureRow = props => (
    <Row>
        <div className={styles.item}>
            <strong>{props.hours < 10 && "0"}{props.hours}</strong>
        </div>
        <WrappingRow>
            {props.departures
                .sort((a, b) => a.minutes > b.minutes)
                .map((departure, index) => <Departure key={index} {...departure}/>)}
        </WrappingRow>
    </Row>
);

const Table = (props) => {
    const departuresByHour = groupBy(props.departures, "hours");
    return (
        <div className={styles.table}>
            {Object.keys(departuresByHour)
                .sort((a, b) => (parseInt(a, 10) + 19) % 24 > (parseInt(b, 10) + 19) % 24)
                .map(hours => (
                    <DepartureRow
                        key={hours} hours={hours}
                        departures={departuresByHour[hours]}
                    />
                ))
            }
        </div>
    );
};

const Timetable = props => (
    <div className={styles.root}>
        {props.weekdays &&
            <div>
                <Header title_fi="Maanantai - Perjantai" title_se="Måndag - Fredag"/>
                <Table departures={props.weekdays}/>
            </div>
        }
        {props.saturdays &&
            <div>
                <Header title_fi="Lauantai" title_se="Lördag"/>
                <Table departures={props.saturdays}/>
            </div>
        }
        {props.sundays &&
            <div>
                <Header title_fi="Sunnuntai" title_se="Sondag"/>
                <Table departures={props.sundays}/>
            </div>
        }
    </div>
);

export default Timetable;
