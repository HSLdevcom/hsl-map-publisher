import React, { Component, PropTypes } from "react";
import { JustifiedColumn, Spacer, FlexSpacer } from "components/util";
import { fetchStopPosterState } from "util/stopPoster";

import Header from "./header";
import Footer from "./footer";

import Routes from "./routes";
import Timetable from "./timetable";
import Info from "./info";

import Map from "./map";
import RouteDiagram from "./routeDiagram/routeDiagram";

import styles from "./stopPoster.css";


class StopPoster extends Component {

    componentDidMount() {
        if (this.props.stopId) {
            this.fetchState(this.props.stopId);
        } else {
            this.props.onReady(new Error("Invalid props"));
        }
    }

    componentDidUpdate(prevProps) {
        if (!this.props.stopId) {
            this.props.onReady(new Error("Invalid props"));
        } else if (this.props.stopId !== prevProps.stopId) {
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
                    <Header {...this.state.stop}/>

                    <div className={styles.content}>
                        <div>
                            <Routes routes={this.state.routes}/>
                            <div className={styles.title}>Pysäkkiaikataulu</div>
                            <Timetable {...this.state.timetable}/>
                            <Info/>
                        </div>

                        <Spacer width={50}/>

                        <div>
                            <Map {...this.state.maps}/>
                            <div className={styles.title}>Linjojen reitit</div>
                            <RouteDiagram stop={this.state.stop} routes={this.state.routes}/>
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
    onReady: PropTypes.func.isRequired,
};

export default StopPoster;
