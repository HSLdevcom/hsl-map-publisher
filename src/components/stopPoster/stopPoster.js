import React, { Component, PropTypes } from "react";
import { JustifiedColumn, Spacer, FlexSpacer } from "components/util";
import RouteDiagram from "components/routeDiagram/routeDiagramContainer";
import Timetable from "components/timetable/timetableContainer";

import Header from "./headerContainer";
import Footer from "./footer";

import Routes from "./routesContainer";

import Map from "./mapContainer";

import styles from "./stopPoster.css";

// eslint-disable-next-line react/prefer-stateless-function
class StopPoster extends Component {
    render() {
        return (
            <div className={styles.root}>
                <JustifiedColumn>
                    <Header stopId={this.props.stopId}/>

                    <div className={styles.content}>
                        <div className={styles.leftColumn}>
                            <Routes stopId={this.props.stopId} date={this.props.date}/>
                            <div className={styles.title}>
                                Pysäkkiaikataulu&nbsp;&nbsp;
                                <span className={styles.subtitle}>Hållplatstidtabell</span>
                            </div>
                            <Timetable
                                stopId={this.props.stopId}
                                date={this.props.date}
                                isSummerTimetable={this.props.isSummerTimetable}
                            />
                        </div>

                        <Spacer width={50}/>

                        <div>
                            <Map stopId={this.props.stopId} date={this.props.date}/>
                            <div className={styles.title}>
                                Linjojen reitit&nbsp;&nbsp;
                                <span className={styles.subtitle}>Linjernas rutter</span>
                            </div>
                            <RouteDiagram stopId={this.props.stopId} date={this.props.date}/>
                        </div>
                    </div>

                    <FlexSpacer/>
                    <Footer/>
                </JustifiedColumn>
            </div>
        );
    }
}

StopPoster.propTypes = {
    stopId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    isSummerTimetable: PropTypes.bool,
};

StopPoster.defaultProps = {
    isSummerTimetable: false,
};

export default StopPoster;
