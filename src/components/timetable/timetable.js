import React from "react";
import PropTypes from "prop-types";
import { Spacer } from "components/util";
import classNames from "classnames";

import TableHeader from "./tableHeader";
import TableRows from "./tableRows";

import styles from "./timetable.css";

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
                <div>Aikataulut voimassa</div>
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
                <TableHeader titleFi="Maanantai - Perjantai" titleSe="Måndag - Fredag"/>
                <TableRows departures={props.weekdays}/>
            </div>
        }
        {props.saturdays && props.saturdays.length > 0 &&
            <div>
                <TableHeader titleFi="Lauantai" titleSe="Lördag"/>
                <TableRows departures={props.saturdays}/>
            </div>
        }
        {props.sundays && props.sundays.length > 0 &&
            <div>
                <TableHeader titleFi="Sunnuntai" titleSe="Söndag"/>
                <TableRows departures={props.sundays}/>
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
};

export default Timetable;
