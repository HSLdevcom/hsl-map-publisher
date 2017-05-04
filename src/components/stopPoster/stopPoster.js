import React, { Component } from "react";
import PropTypes from "prop-types";
import { JustifiedColumn, Spacer } from "components/util";
import renderQueue from "util/renderQueue";

import RouteDiagram from "components/routeDiagram/routeDiagramContainer";
import Timetable from "components/timetable/timetableContainer";

import Header from "./headerContainer";
import Footer from "./footer";

import Map from "./mapContainer";
import Routes from "./routesContainer";

import styles from "./stopPoster.css";

const MAP_MIN_HEIGHT = 500;

// eslint-disable-next-line react/prefer-stateless-function
class StopPoster extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasRoutesOnTop: false,
            hasRouteDiagram: true,
            shouldRenderMap: false,
            hasMap: true,
        };
    }

    componentWillMount() {
        renderQueue.add(this);
    }

    componentDidMount() {
        this.handleLayout();
    }

    componentDidUpdate() {
        this.handleLayout();
    }

    hasOverflow() {
        return (this.content.scrollWidth > this.content.clientWidth) ||
               (this.content.scrollHeight > this.content.clientHeight);
    }

    async handleLayout() {
        await (() => new Promise(resolve => renderQueue.onEmpty(resolve, { ignore: this })))();

        if (this.hasOverflow()) {
            if (!this.state.hasRoutesOnTop) {
                this.setState({ hasRoutesOnTop: true });
                return;
            }
            if (this.state.hasRouteDiagram) {
                this.setState({ hasRouteDiagram: false });
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
                    segments={props.segments}
                />
            </div>
        );

        return (
            <div className={styles.root}>
                <JustifiedColumn>
                    <Header stopId={this.props.stopId}/>

                    <div className={styles.content} ref={(ref) => { this.content = ref; }}>
                        {this.state.hasRoutesOnTop &&
                        <Routes
                            stopId={this.props.stopId}
                            date={this.props.date}
                            columns={6}
                        />
                        }
                        <div className={styles.columns}>
                            <div>
                                {!this.state.hasRoutesOnTop &&
                                <Routes stopId={this.props.stopId} date={this.props.date}/>
                                }
                                <div className={styles.title}>Pysäkkiaikataulu</div>
                                {this.state.hasRouteDiagram &&
                                <StopPosterTimetable/>
                                }
                                {!this.state.hasRouteDiagram &&
                                <StopPosterTimetable segments={["weekdays"]}/>
                                }
                            </div>

                            <Spacer width={50}/>

                            <div className={styles.right}>
                                {this.state.hasMap && this.state.hasRoutesOnTop &&
                                <div className={styles.title}>&nbsp;</div>
                                }
                                {this.state.hasMap &&
                                <div className={styles.map} ref={(ref) => { this.map = ref; }}>
                                    {this.state.shouldRenderMap &&
                                    <Map
                                        stopId={this.props.stopId}
                                        date={this.props.date}
                                        width={this.map.clientWidth}
                                        height={this.map.clientHeight}
                                    />
                                    }
                                </div>
                                }

                                {!this.state.hasRouteDiagram &&
                                <span>
                                    <div className={styles.title}>&nbsp;</div>
                                    <div className={styles.timetables}>
                                        <StopPosterTimetable segments={["saturdays"]}/>
                                        <Spacer width={50}/>
                                        <StopPosterTimetable segments={["sundays"]}/>
                                    </div>
                                </span>
                                }
                                {this.state.hasRouteDiagram &&
                                <span>
                                    <div className={styles.title}>Linjojen reitit</div>
                                    <RouteDiagram
                                        stopId={this.props.stopId}
                                        date={this.props.date}
                                    />
                                </span>
                                }
                            </div>
                        </div>
                    </div>

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
    dateBegin: PropTypes.string,
    dateEnd: PropTypes.string,
};

StopPoster.defaultProps = {
    isSummerTimetable: false,
    dateBegin: null,
    dateEnd: null,
};

export default StopPoster;
