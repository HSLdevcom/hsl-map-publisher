import React, { Component } from "react";
import PropTypes from "prop-types";
import { JustifiedColumn, Spacer } from "components/util";
import renderQueue from "util/renderQueue";

import CropMarks from "components/cropMarks";
import RouteDiagram from "components/routeDiagram/routeDiagramContainer";
import Timetable from "components/timetable/timetableContainer";
import StopMap from "components/map/stopMapContainer";

import Header from "./headerContainer";
import Footer from "./footerContainer";

import Routes from "./routesContainer";

import styles from "./stopPoster.css";

const MAP_MIN_HEIGHT = 500;

class StopPoster extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasRoutesOnTop: false,
            hasRoutes: true,
            hasRouteDiagram: true,
            shouldRenderMap: false,
            hasMap: true,
        };
    }

    componentWillMount() {
        renderQueue.add(this);
    }

    componentDidMount() {
        renderQueue.onEmpty(() => this.updateLayout(), { ignore: this });
    }

    componentDidUpdate() {
        renderQueue.onEmpty(() => this.updateLayout(), { ignore: this });
    }

    hasOverflow() {
        return (this.content.scrollWidth > this.content.clientWidth) ||
               (this.content.scrollHeight > this.content.clientHeight);
    }

    updateLayout() {
        if (this.hasOverflow()) {
            if (!this.state.hasRoutesOnTop) {
                this.setState({ hasRoutesOnTop: true });
                return;
            }
            if (this.state.hasRouteDiagram) {
                this.setState({ hasRouteDiagram: false });
                return;
            }
            if (this.state.hasRoutes) {
                this.setState({ hasRoutes: false });
                return;
            }
            renderQueue.remove(this, { success: false });
            return;
        }

        if (this.state.hasMap) {
            if (this.map.clientHeight < MAP_MIN_HEIGHT) {
                this.setState({ hasMap: false });
                return;
            }
            if (!this.state.shouldRenderMap) {
                this.setState({ shouldRenderMap: true });
                return;
            }
        }

        renderQueue.remove(this, { success: true });
    }

    render() {
        const StopPosterTimetable = props => (
            <div className={styles.timetable}>
                <Timetable
                    stopId={this.props.stopId}
                    date={this.props.date}
                    isSummerTimetable={this.props.isSummerTimetable}
                    dateBegin={this.props.dateBegin}
                    dateEnd={this.props.dateEnd}
                    showValidityPeriod={!props.hideDetails}
                    showNotes={!props.hideDetails}
                    segments={props.segments}
                />
            </div>
        );

        return (
            <CropMarks>
                <div className={styles.root}>
                    <JustifiedColumn>
                        <Header stopId={this.props.stopId} date={this.props.date}/>

                        <div className={styles.content} ref={(ref) => { this.content = ref; }}>
                            {this.state.hasRoutes && this.state.hasRoutesOnTop &&
                            <Routes stopId={this.props.stopId} date={this.props.date}/>
                            }
                            <div className={styles.columns}>
                                <div className={styles.left}>
                                    {this.state.hasRoutes && !this.state.hasRoutesOnTop &&
                                        <Routes stopId={this.props.stopId} date={this.props.date}/>
                                    }
                                    {this.state.hasRoutes &&
                                        <div className={styles.title}>
                                            Pysäkkiaikataulu&nbsp;&nbsp;
                                            <span className={styles.subtitle}>
                                                Hållplatstidtabell
                                            </span>
                                        </div>
                                    }
                                    {this.state.hasRouteDiagram &&
                                        <StopPosterTimetable/>
                                    }
                                    {!this.state.hasRouteDiagram &&
                                        <StopPosterTimetable segments={["weekdays"]}/>
                                    }
                                </div>

                                <Spacer width={50}/>

                                <div className={styles.right}>
                                    {this.state.hasRoutes && this.state.hasRoutesOnTop &&
                                        <div className={styles.title}>&nbsp;</div>
                                    }

                                    {!this.state.hasRouteDiagram &&
                                        <div className={styles.timetables}>
                                            <StopPosterTimetable segments={["saturdays"]} hideDetails/>
                                            <Spacer width={50}/>
                                            <StopPosterTimetable segments={["sundays"]} hideDetails/>
                                        </div>
                                    }

                                    {!this.state.hasRouteDiagram && <Spacer height={50}/>}

                                    {this.state.hasMap &&
                                    <div className={styles.map} ref={(ref) => { this.map = ref; }}>
                                        {this.state.shouldRenderMap &&
                                        <StopMap
                                            stopId={this.props.stopId}
                                            date={this.props.date}
                                            width={this.map.clientWidth}
                                            height={this.map.clientHeight}
                                        />
                                        }
                                    </div>
                                    }

                                    {!this.state.hasRouteDiagram && <Spacer height={50}/>}

                                    {this.state.hasRouteDiagram &&
                                    <span>
                                        <div className={styles.title}>
                                            Linjojen reitit&nbsp;&nbsp;
                                            <span className={styles.subtitle}>
                                                Linjernas rutter
                                            </span>
                                        </div>
                                        <RouteDiagram
                                            stopId={this.props.stopId}
                                            date={this.props.date}
                                        />
                                    </span>
                                    }
                                </div>
                            </div>
                        </div>

                        <Footer stopId={this.props.stopId}/>
                    </JustifiedColumn>
                </div>
            </CropMarks>
        );
    }
}

StopPoster.propTypes = {
    stopId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    isSummerTimetable: PropTypes.bool,
    dateBegin: PropTypes.string,
    dateEnd: PropTypes.string,
};

StopPoster.defaultProps = {
    isSummerTimetable: false,
    dateBegin: null,
    dateEnd: null,
};

export default StopPoster;
