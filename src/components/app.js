import React from "react";
import { JustifiedColumn, Spacer } from "components/util";

import Header from "./header";
import Footer from "./footer";

import Routes from "./routes";
import Timetable from "./timetable";
import Info from "./info";

import Map from "./map";
import RouteDiagram from "./routeDiagram";

import styles from "./app.css";

const Title = props => (
    <div className={styles.title}>
        {props.children}
    </div>
);

const FlexSpacer = () => <div style={{ flex: "2" }}/>;

const App = () => (
    <div className={styles.root}>
        <JustifiedColumn>
            <Header/>

            <div className={styles.content}>
                <div className={styles.left}>
                    <Routes/>
                    <Title>Pysäkkiaikataulu</Title>
                    <Timetable/>
                    <Info/>
                </div>

                <Spacer width={50}/>

                <div className={styles.right}>
                    <Map/>
                    <Title>Linjojen reitit</Title>
                    <RouteDiagram/>
                </div>
            </div>

            <FlexSpacer/>
            <Footer/>
        </JustifiedColumn>
    </div>
);

export default App;
