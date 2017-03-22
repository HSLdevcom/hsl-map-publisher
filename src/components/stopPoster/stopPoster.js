import React, { PropTypes } from "react";
import { JustifiedColumn, Spacer, FlexSpacer } from "components/util";
import RouteDiagram from "components/routeDiagram/routeDiagramContainer";
import Timetable from "components/timetable/timetableContainer";

import Header from "./headerContainer";
import Footer from "./footer";

import Routes from "./routesContainer";
import Info from "./info";

import Map from "./mapContainer";

import styles from "./stopPoster.css";


function StopPoster(props) {
    return (
        <div className={styles.root}>
            <JustifiedColumn>
                <Header stopId={props.stopId}/>

                <div className={styles.content}>
                    <div>
                        <Routes stopId={props.stopId} date={props.date}/>
                        <div className={styles.title}>Pysäkkiaikataulu</div>
                        <Timetable stopId={props.stopId} date={props.date}/>
                        <Info/>
                    </div>

                    <Spacer width={50}/>

                    <div>
                        <Map stopId={props.stopId} date={props.date}/>
                        <div className={styles.title}>Linjojen reitit</div>
                        <RouteDiagram stopId={props.stopId} date={props.date}/>
                    </div>
                </div>

                <FlexSpacer/>
                <Footer/>
            </JustifiedColumn>
        </div>
    );
}

StopPoster.propTypes = {
    stopId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
};

export default StopPoster;
