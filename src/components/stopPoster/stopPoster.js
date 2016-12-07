import React, { Component } from "react";
import { JustifiedColumn, Spacer, FlexSpacer } from "components/util";
import { fetchStopPosterProps } from "util/stopPoster";

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

class StopPoster extends Component {

    componentDidMount() {
        if (this.props.stopId) {
            this.fetchContent(this.props.stopId);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.stopId && this.props.stopId !== prevProps.stopId) {
            this.fetchContent(this.props.stopId);
        }
    }

    componentWillUnmount() { // eslint-disable-line
        // TODO: Cancel ongoing request
    }

    fetchContent(stopId) {
        // TODO: Call on ready callback
        fetchStopPosterProps(stopId).then(props => this.setState(props));
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
                            <Title>Pysäkkiaikataulu</Title>
                            <Timetable {...this.state.timetable}/>
                            <Info/>
                        </div>

                        <Spacer width={50}/>

                        <div>
                            <Map {...this.state.map}/>
                            <Title>Linjojen reitit</Title>
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

export default StopPoster;
