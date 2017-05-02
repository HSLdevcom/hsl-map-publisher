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

// eslint-disable-next-line react/prefer-stateless-function
class StopPoster extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasRoutesOnTop: false,
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
        return (this.content.scrollHeight > this.content.clientHeight) ||
               (this.content.scrollHeight > this.content.clientHeight);
    }

    async handleLayout() {
        await (() => new Promise(resolve => renderQueue.onEmpty(resolve, { ignore: this })))();

        if (!this.hasOverflow()) {
            renderQueue.remove(this, { success: true });
            return;
        }

        if (!this.state.hasRoutesOnTop) {
            this.setState({ hasRoutesOnTop: true });
            return;
        }

        renderQueue.remove(this, { success: false });
    }

    render() {
        return (
            <div className={styles.root}>
                <JustifiedColumn>
                    <Header stopId={this.props.stopId}/>

                    <div className={styles.content} ref={(ref) => { this.content = ref; }}>
                        {this.state.hasRoutesOnTop &&
                            <span>
                                <Routes
                                    stopId={this.props.stopId}
                                    date={this.props.date}
                                    columns={6}
                                />
                                <Spacer height={50}/>
                            </span>
                        }
                        <div className={styles.columns}>
                            <div className={styles.left}>
                                {!this.state.hasRoutesOnTop &&
                                    <span>
                                        <Routes stopId={this.props.stopId} date={this.props.date}/>
                                        <div className={styles.title}>Pysäkkiaikataulu</div>
                                    </span>
                                }
                                <Timetable
                                    stopId={this.props.stopId}
                                    date={this.props.date}
                                    isSummerTimetable={this.props.isSummerTimetable}
                                    dateBegin={this.props.dateBegin}
                                    dateEnd={this.props.dateEnd}
                                />
                            </div>

                            <Spacer width={50}/>

                            <div>
                                <Map stopId={this.props.stopId} date={this.props.date}/>
                                <div className={styles.title}>Linjojen reitit</div>
                                <RouteDiagram stopId={this.props.stopId} date={this.props.date}/>
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
