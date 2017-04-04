import React, { Component } from "react";

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import DatePicker from "material-ui/DatePicker";
import RaisedButton from "material-ui/RaisedButton";
import Divider from "material-ui/Divider";

import RadioGroup from "components/radioGroup";
import StopTable from "components/stopTable";

import styles from "./app.css";

const muiTheme = getMuiTheme({});

const labelsByComponent = {
    StopPoster: "Pysäkkijuliste",
    Timetable: "Aikataulu",
};

const tableTypes = {
    stops: "Pysäkit",
    groups: "Listat",
};

const tableProps = {
    columns: ["Tunnus", "Nimi"],
    rows: [
        {
            isSelected: false,
            values: ["124567", "Hello"],
        },
        {
            isSelected: false,
            values: ["124567", "Hello"],
        },
        {
            isSelected: false,
            values: ["124567", "Hello"],
        },
    ],
};

class App extends Component {
    constructor() {
        super();
        this.state = {};
    }

    render() {
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
                            <DatePicker defaultDate={new Date()}/>
                        </div>
                    </div>

                    <StopTable {...tableProps}/>

                    <Divider/>
                    <br/>
                    <RaisedButton primary label="Generoi"/>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default App;
