import React from "react";
import { JustifiedColumn, Spacer } from "components/util";

import Header from "./header";
import Footer from "./footer";

import Routes from "./routes";
import Timetable from "./timetable";
import Info from "./info";

import Map from "./map";
import RouteDiagram from "./routeDiagram/routeDiagram";

import styles from "./stopPoster.css";

const Title = props => (
    <div className={styles.title}>
        {props.children}
    </div>
);

const FlexSpacer = () => <div style={{ flex: "2" }}/>;

const StopPoster = props => (
    <div className={styles.root}>
        <JustifiedColumn>
            <Header {...props.stop}/>

            <div className={styles.content}>
                <div>
                    <Routes routes={props.routes}/>
                    <Title>Pysäkkiaikataulu</Title>
                    <Timetable {...props.timetable}/>
                    <Info/>
                </div>

                <Spacer width={50}/>

                <div>
                    <Map {...props.map}/>
                    <Title>Linjojen reitit</Title>
                    <RouteDiagram stop={props.stop} routes={props.routes}/>
                </div>
            </div>

            <FlexSpacer/>
            <Footer/>
        </JustifiedColumn>
    </div>
);

export default StopPoster;
