import React from "react";

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import muiTheme from "styles/theme";
import { Tabs, Tab } from "material-ui/Tabs";

import Generator from "components/generator";
import History from "components/history";

import styles from "./app.css";

const App = () => (
    <MuiThemeProvider muiTheme={muiTheme}>
        <div className={styles.root}>
            <Tabs>
                <Tab label="Generointi">
                    <div className={styles.tab}>
                        <Generator/>
                    </div>
                </Tab>
                <Tab label="Historia">
                    <div className={styles.tab}>
                        <History/>
                    </div>
                </Tab>
            </Tabs>
        </div>
    </MuiThemeProvider>
);

export default App;
