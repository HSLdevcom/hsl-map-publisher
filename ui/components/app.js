import React, { Component, PropTypes } from "react";

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import AppBar from "material-ui/AppBar";
import DatePicker from "material-ui/DatePicker";
import { RadioButton, RadioButtonGroup } from "material-ui/RadioButton";
import RaisedButton from "material-ui/RaisedButton";
import Divider from 'material-ui/Divider';

import styles from "./app.css";

const muiTheme = getMuiTheme({});

const labelsByComponent = {
    "StopPoster": "Pysäkkijuliste",
    "Timetable": "Aikataulu",
};

const tableTypes = {
    stops: "Pysäkit",
    groups: "Listat",
};

const RadioGroup = (props) => (
    <RadioButtonGroup name="component" defaultSelected={Object.keys(props.items)[0]}>
        {Object.keys(props.items).map(key => (
            <RadioButton
                key={key}
                value={key}
                label={props.items[key]}
                className={styles.radio}
            />
        ))}
    </RadioButtonGroup>
);

RadioGroup.propTypes = {
    items: React.PropTypes.objectOf(React.PropTypes.string)
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

                    <Divider/>
                    <br/>
                    <RaisedButton primary label="Generoi"/>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default App;
