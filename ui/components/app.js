import React, { Component } from "react";

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import muiTheme from "styles/theme";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import { Tabs, Tab } from "material-ui/Tabs";

import Generator from "components/generator";
import History from "components/history";

import styles from "./app.css";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    onDialogClose() {
        this.setState({ message: null });
    }

    render() {
        return (
            <MuiThemeProvider muiTheme={muiTheme}>
                <div className={styles.root}>
                    <Dialog
                        open={!!this.state.message}
                        onRequestClose={() => this.onDialogClose()}
                        actions={[
                            <FlatButton
                                onTouchTap={() => this.onDialogClose()}
                                label="OK"
                                primary
                            />,
                        ]}
                    >
                        {this.state.message}
                    </Dialog>
                    <Tabs>
                        <Tab label="Generointi">
                            <div className={styles.tab}>
                                <Generator onMessage={message => this.setState({ message })}/>
                            </div>
                        </Tab>
                        <Tab label="Historia">
                            <div className={styles.tab}>
                                <History onMessage={message => this.setState({ message })}/>
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default App;
