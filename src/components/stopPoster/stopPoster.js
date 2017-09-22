import React, { Component } from "react";
import PropTypes from "prop-types";
import { JustifiedColumn, Spacer, Image } from "components/util";
import renderQueue from "util/renderQueue";
import { colorsByMode } from "util/domain";

import CropMarks from "components/cropMarks";
import RouteDiagram from "components/routeDiagram/routeDiagramContainer";
import Timetable from "components/timetable/timetableContainer";
import StopMap from "components/map/stopMapContainer";

import mobileAd from "icons/mobile_ad.svg";
import mobileAdTrunk from "icons/mobile_ad_trunk.svg";

import Header from "./headerContainer";
import Footer from "./footer";

import Routes from "./routesContainer";

import styles from "./stopPoster.css";

const MAP_MIN_HEIGHT = 500;

const trunkStopStyle = {
    "--background": colorsByMode.TRUNK,
    "--light-background": "#FFE0D1",
};

class StopPoster extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasAd: true,
            hasRoutesOnTop: false,
            hasRouteDiagram: true,
            hasRoutes: true,
            hasStretchedLeftColumn: false,
            shouldRenderMap: false,
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
        if (!this.props.hasRoutes) {
            renderQueue.remove(this, { error: new Error("No valid routes for stop") });
            return;
        }

        if (this.hasOverflow() && this.state.shouldRenderMap) {
            renderQueue.remove(this, { error: new Error("Map render caused layout overflow") });
            return;
        }

        if (this.hasOverflow()) {
            if (this.state.hasAd) {
                this.setState({ hasAd: false });
                return;
            }
            if (!this.state.hasRoutesOnTop) {
                this.setState({ hasRoutesOnTop: true });
                return;
            }
            if (this.state.hasRouteDiagram) {
                this.setState({ hasRouteDiagram: false, hasAd: true });
                return;
            }
            if (this.state.hasRoutes) {
                this.setState({ hasRoutes: false });
                return;
            }
            if (!this.state.hasStretchedLeftColumn) {
                this.setState({ hasStretchedLeftColumn: true });
                return;
            }
            renderQueue.remove(this, { error: new Error("Failed to remove layout overflow") });
            return;
        }

        if (!this.state.shouldRenderMap && this.map.clientHeight >= MAP_MIN_HEIGHT) {
            this.setState({ shouldRenderMap: true });
            return;
        }

        renderQueue.remove(this);
    }

    render() {
        if (!this.props.hasRoutes) {
            return null;
        }

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
                    showComponentName={!props.hideDetails}
                    segments={props.segments}
                />
            </div>
        );

        return (
            <CropMarks>
                <div className={styles.root} style={this.props.isTrunkStop ? trunkStopStyle : null}>
                    <JustifiedColumn>
                        <Header stopId={this.props.stopId}/>
                        <div className={styles.content} ref={(ref) => { this.content = ref; }}>
                            <Spacer width="100%" height={50}/>
                            {this.state.hasRoutes && this.state.hasRoutesOnTop &&
                            <Routes stopId={this.props.stopId} date={this.props.date}/>
                            }
                            {this.state.hasRoutes && this.state.hasRoutesOnTop &&
                            <Spacer height={10}/>
                            }
                            <div className={styles.columns}>
                                <div
                                    className={this.state.hasStretchedLeftColumn ?
                                               styles.leftStretched : styles.left}
                                >
                                    {this.state.hasRoutes && !this.state.hasRoutesOnTop &&
                                        <Routes stopId={this.props.stopId} date={this.props.date}/>
                                    }
                                    {this.state.hasRoutes && !this.state.hasRoutesOnTop &&
                                        <Spacer height={10}/>
                                    }
                                    {this.state.hasRouteDiagram &&
                                        <StopPosterTimetable/>
                                    }
                                    {!this.state.hasRouteDiagram &&
                                        <StopPosterTimetable segments={["weekdays"]}/>
                                    }
                                    {this.state.hasAd &&
                                        <Image
                                            src={this.props.isTrunkStop
                                              ? mobileAdTrunk : mobileAd}
                                        />
                                    }
                                </div>

                                <Spacer width={10}/>

                                <div className={styles.right}>
                                    {!this.state.hasRouteDiagram &&
                                        <div className={styles.timetables}>
                                            <StopPosterTimetable segments={["saturdays"]} hideDetails/>
                                            <Spacer width={10}/>
                                            <StopPosterTimetable segments={["sundays"]} hideDetails/>
                                        </div>
                                    }

                                    {!this.state.hasRouteDiagram && <Spacer height={10}/>}

                                    <div
                                        className={styles.map}
                                        ref={(ref) => { this.map = ref; }}
                                    >
                                        {this.state.shouldRenderMap &&
                                            <StopMap
                                                stopId={this.props.stopId}
                                                date={this.props.date}
                                                width={this.map.clientWidth}
                                                height={this.map.clientHeight}
                                            />
                                        }
                                    </div>

                                    <Spacer height={10}/>

                                    {this.state.hasRouteDiagram &&
                                        <RouteDiagram
                                            stopId={this.props.stopId}
                                            date={this.props.date}
                                        />
                                    }
                                </div>
                            </div>
                            <Spacer width="100%" height={50}/>
                        </div>
                        <Footer shortId={this.props.shortId} isTrunkStop={this.props.isTrunkStop}/>
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
    hasRoutes: PropTypes.bool.isRequired,
    isTrunkStop: PropTypes.bool.isRequired,
    shortId: PropTypes.string.isRequired,
};

StopPoster.defaultProps = {
    isSummerTimetable: false,
    dateBegin: null,
    dateEnd: null,
};

export default StopPoster;
