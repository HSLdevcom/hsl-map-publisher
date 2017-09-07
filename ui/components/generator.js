import React, { Component } from "react";
import PropTypes from "prop-types";

import RaisedButton from "material-ui/RaisedButton";
import DatePicker from "material-ui/DatePicker";
import RadioGroup from "components/radioGroup";

import moment from "moment";

import StopList from "components/stopList";

import { fetchStops, generate } from "util/api";
import { stopsToRows, stopsToGroupRows } from "util/stops";

import styles from "./generator.css";

const componentsByType = {
    Pysäkkijuliste: {
        name: "StopPoster",
        filter: stop => stop.hasShelter,
    },
    Aikataulu: {
        name: "Timetable",
        filter: stop => !stop.hasShelter,
    },
};

const rowFactoriesByType = {
    Pysäkit: {
        factory: stops => stopsToRows(stops),
    },
    Ajolistat: {
        factory: stops => stopsToGroupRows(stops),
    },
};

class Generator extends Component {
    constructor() {
        super();
        this.state = {
            rows: [],
            stops: [],
            componentsByType,
            selectedComponent: Object.values(componentsByType)[0],
            rowFactoriesByType,
            selectedRowFactory: Object.values(rowFactoriesByType)[0],
            selectedDate: new Date(),
            isSummerTimetable: false,
        };
    }

    componentDidMount() {
        fetchStops()
            .then((stops) => {
                this.setState({ stops }, () => this.resetRows());
            }).catch((error) => {
                this.props.onMessage(`Pysäkkien hakeminen epäonnistui: ${error.message}`);
                console.error(error); // eslint-disable-line no-console
            });
    }

    onGenerate() {
        const component = this.state.selectedComponent.name;
        const checkedRows = this.state.rows.filter(({ isChecked }) => isChecked);

        this.resetRows();

        const props = checkedRows
            .reduce((prev, { stopIds }) => [...prev, ...stopIds], [])
            .map(stopId => ({
                stopId,
                date: moment(this.state.selectedDate).format("YYYY-MM-DD"),
                isSummerTimetable: this.state.isSummerTimetable,
                dateBegin: this.state.dateBegin
                    ? moment(this.state.dateBegin).format("YYYY-MM-DD")
                    : null,
                dateEnd: this.state.dateEnd
                    ? moment(this.state.dateEnd).format("YYYY-MM-DD")
                    : null,
            }));

        const filename = checkedRows.length === 1 ? `${checkedRows[0].title}.pdf` : "output.pdf";

        generate(component, props, filename)
            .catch((error) => {
                this.props.onMessage(`Generointi epäonnistui: ${error.message}`);
                console.error(error); // eslint-disable-line no-console
            });
    }

    onDateChange(date) {
        this.setState({ selectedDate: date });
    }

    onRowFactoryChange(value) {
        this.setState({ selectedRowFactory: value }, () => this.resetRows());
    }

    onComponentChange(value) {
        this.setState({ selectedComponent: value }, () => this.resetRows());
    }

    onRowChecked(checkedRow, isChecked) {
        const rows = this.state.rows.map(row => (row === checkedRow ? { ...row, isChecked } : row));
        this.setState({ rows });
    }

    resetRows() {
        const component = this.state.selectedComponent;
        const stops = this.state.stops.filter(component.filter);
        const rows = this.state.selectedRowFactory.factory(stops);
        this.setState({ rows });
    }

    render() {
        const stopCount = this.state.rows
            .filter(({ isChecked }) => isChecked)
            .map(({ stopIds }) => stopIds.length)
            .reduce((prev, cur) => prev + cur, 0);

        return (
            <div className={styles.root}>
                <div className={styles.row}>
                    <div className={styles.column}>
                        <h3>Tuloste</h3>
                        <RadioGroup
                            valuesByLabel={this.state.componentsByType}
                            valueSelected={this.state.selectedComponent}
                            onChange={value => this.onComponentChange(value)}
                        />
                    </div>

                    <div className={styles.column}>
                        <h3>Näytä</h3>
                        <RadioGroup
                            valuesByLabel={this.state.rowFactoriesByType}
                            valueSelected={this.state.selectedRowFactory}
                            onChange={value => this.onRowFactoryChange(value)}
                        />
                    </div>

                    <div className={styles.column}>
                        <h3>Aikataulukausi</h3>
                        <RadioGroup
                            valuesByLabel={{ Talvi: false, Kesä: true }}
                            valueSelected={this.state.isSummerTimetable}
                            onChange={value => this.setState({ isSummerTimetable: value })}
                        />
                    </div>

                    <div className={styles.column}>
                        <h3>Päivämäärä</h3>
                        <DatePicker
                            value={this.state.selectedDate}
                            onChange={(event, date) => this.onDateChange(date)}
                            container="inline"
                        />
                    </div>

                    <div className={styles.column}>
                        <h3>Voimassaolokausi alkaa</h3>
                        <DatePicker
                            value={this.state.dateBegin}
                            onChange={(event, date) => this.setState({ dateBegin: date })}
                            hintText="oletus"
                            container="inline"
                        />
                    </div>

                    <div className={styles.column}>
                        <h3>Voimassaolokausi loppuu</h3>
                        <DatePicker
                            value={this.state.dateEnd}
                            onChange={(event, date) => this.setState({ dateEnd: date })}
                            hintText="oletus"
                            container="inline"
                        />
                    </div>
                </div>

                <div className={styles.main}>
                    <StopList
                        rows={this.state.rows}
                        onCheck={(index, isChecked) => this.onRowChecked(index, isChecked)}
                    />
                </div>

                <div className={styles.footer}>
                    <RaisedButton
                        disabled={!stopCount}
                        onTouchTap={() => this.onGenerate()}
                        label={`Generoi (${stopCount})`}
                        style={{ height: 45, flexGrow: 1 }}
                        primary
                    />
                </div>
            </div>
        );
    }
}

Generator.propTypes = {
    onMessage: PropTypes.func.isRequired,
};

export default Generator;
