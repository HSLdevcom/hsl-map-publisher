import React, { Component } from "react";

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import muiTheme from "styles/theme";

import DatePicker from "material-ui/DatePicker";
import RaisedButton from "material-ui/RaisedButton";
import RadioGroup from "components/radioGroup";
import StopList from "components/stopList";

import { fetchStops } from "util/stops";

import styles from "./app.css";

const labelsByComponent = {
    StopPoster: "Pysäkkijuliste",
    Timetable: "Aikataulu",
};

const tableTypes = {
    stops: "Pysäkit",
    groups: "Listat",
};

class App extends Component {
    constructor() {
        super();
        this.state = {
            rows: [],
            selectedDate: new Date(),
        };
    }

    componentDidMount() {
        fetchStops().then((stops) => {
            const rows = stops.map(({ shortId, nameFi, stopId }) => ({
                isChecked: false,
                title: `${shortId} ${nameFi}`,
                subtitle: `(${stopId})`,
                stopIds: [stopId],
            }));
            this.setState({ rows });
        });
    }


    onDateChange(date) {
        this.setState({ selectedDate: date });
    }

    onCheck(rowIndex, isChecked) {
        const rows = this.state.rows.map(
            (row, index) => ((rowIndex === index) ? { ...row, isChecked } : row)
        );
        this.setState({ rows });
    }

    onGenerate() {
        const props = this.state.rows
            .filter(({ isChecked }) => isChecked)
            .reduce((prev, { stopIds }) => [...prev, ...stopIds], [])
            .map(stopId => ({ stopId, date: this.state.selectedDate }));
        const body = { component: "StopPoster", props };

        fetch("http://localhost:4000", { method: "POST", body: JSON.stringify(body) })
            .then(response => response.json())
            .then((response) => {
                this.resetRows();
                window.open(response.url);
            })
            .catch((error) => {
                console.log(error); // eslint-disable-line no-console
            });
    }

    resetRows() {
        this.setState({ rows: this.state.rows.map(row => ({ ...row, isChecked: false })) });
    }

    render() {
        const checkedRowCount = this.state.rows.filter(({ isChecked }) => isChecked).length;

        return (
            <MuiThemeProvider muiTheme={muiTheme}>
                <div className={styles.root}>
                    <div className={styles.row}>
                        <div className={styles.column}>
                            <h3>Tuloste</h3>
                            <RadioGroup items={labelsByComponent}/>
                        </div>

                        <div className={styles.column}>
                            <h3>Tyyppi</h3>
                            <RadioGroup items={tableTypes}/>
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
                            onCheck={(index, isChecked) => this.onCheck(index, isChecked)}
                        />
                    </div>

                    <div className={styles.footer}>
                        <RaisedButton
                            disabled={!checkedRowCount}
                            onTouchTap={() => this.onGenerate()}
                            label={`Generoi (${checkedRowCount})`}
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
