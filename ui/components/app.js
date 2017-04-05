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
        this.state = {};
    }

    componentDidMount() {
        fetchStops().then((stops) => {
            const rows = stops.map(({ shortId, nameFi, stopId }) => ({
                isSelected: false,
                title: `${shortId} ${nameFi}`,
                subtitle: `(${stopId})`,
                ids: [stopId],
            }));
            this.setState({ rows });
        });
    }

    render() {
        if (!this.state.rows) return null;

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
                            <DatePicker defaultDate={new Date()} container="inline"/>
                        </div>
                    </div>

                    <div className={styles.main}>
                        <StopList rows={this.state.rows}/>
                    </div>

                    <div className={styles.footer}>
                        <RaisedButton primary style={{ height: 45 }} label="Generoi"/>
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default App;
