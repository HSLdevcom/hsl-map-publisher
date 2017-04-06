import React, { Component } from "react";

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import muiTheme from "styles/theme";

import DatePicker from "material-ui/DatePicker";
import RaisedButton from "material-ui/RaisedButton";
import RadioGroup from "components/radioGroup";
import StopList from "components/stopList";

import { fetchStops, generate } from "util/api";
import { stopsToRows, stopsToGroupRows } from "util/stops";

import styles from "./app.css";

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

class App extends Component {
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
        };
    }

    componentDidMount() {
        fetchStops()
            .then((stops) => {
                this.setState({ stops }, () => this.resetRows());
            }).catch((error) => {
                console.error(error); // eslint-disable-line no-console
            });
    }

    onGenerate() {
        const component = this.state.selectedComponent.name;
        const props = this.state.rows
            .filter(({ isChecked }) => isChecked)
            .reduce((prev, { stopIds }) => [...prev, ...stopIds], [])
            .map(stopId => ({ stopId, date: this.state.selectedDate }));

        generate(component, props)
            .then((url) => {
                this.resetRows();
                window.open(url);
            })
            .catch((error) => {
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

    onRowChecked(rowIndex, isChecked) {
        const rows = this.state.rows.map(
            (row, index) => ((rowIndex === index) ? { ...row, isChecked } : row)
        );
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
            <MuiThemeProvider muiTheme={muiTheme}>
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
                            <h3>Päivämäärä</h3>
                            <DatePicker
                                value={this.state.selectedDate}
                                onChange={(event, date) => this.onDateChange(date)}
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
                            style={{ height: 45 }}
                            primary
                        />
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default App;
