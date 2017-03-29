import React, { Component, PropTypes } from "react";
import { JustifiedColumn, Spacer, FlexSpacer } from "components/util";
import RouteDiagram from "components/routeDiagram/routeDiagramContainer";
import Timetable from "components/timetable/timetableContainer";
import { fetchStopPosterState } from "util/stopPoster";

import Header from "./headerContainer";
import Footer from "./footer";

import Routes from "./routesContainer";
import Info from "./info";

import Map from "./map";

import styles from "./stopPoster.css";


class StopPoster extends Component {

    componentDidMount() {
        if (this.props.stopId) {
            this.fetchState(this.props.stopId);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.stopId && this.props.stopId !== prevProps.stopId) {
            this.fetchState(this.props.stopId);
        }
    }

    componentWillUnmount() { // eslint-disable-line
        // TODO: Cancel ongoing request
    }

    fetchState() {
        fetchStopPosterState(this.props.stopId)
            .then(state => this.setState(state, () => this.props.onReady()))
            .catch(error => this.props.onReady(error));
    }

    render() {
        if (!this.state) return null;

        return (
            <div className={styles.root}>
                <JustifiedColumn>
                    <Header stopId={this.props.stopId}/>

                    <div className={styles.content}>
                        <div>
                            <Routes stopId={this.props.stopId} date={this.props.date}/>
                            <div className={styles.title}>Pysäkkiaikataulu</div>
                            <Timetable stopId={this.props.stopId} date={this.props.date}/>
                            <Info/>
                        </div>

                        <Spacer width={50}/>

                        <div>
                            <Map {...this.state.maps}/>
                            <div className={styles.title}>Linjojen reitit</div>
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
    onReady: PropTypes.func.isRequired,
};

export default StopPoster;
