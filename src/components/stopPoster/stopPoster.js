import React, { Component } from "react";
import PropTypes from "prop-types";
import { hot } from "react-hot-loader";
import { get } from "lodash";
import { JustifiedColumn, Spacer } from "components/util";
import renderQueue from "util/renderQueue";
import { colorsByMode } from "util/domain";

import CropMarks from "components/cropMarks";
import RouteDiagram from "components/routeDiagram/routeDiagramContainer";
import TramDiagram from "components/tramDiagram/tramDiagram";
import Timetable from "components/timetable/timetableContainer";
import Metadata from "components/metadata";

import Header from "./headerContainer";
import Footer from "./footer";

import Routes from "./routesContainer";
import AdContainer from "./adContainer";

import styles from "./stopPoster.css";
import CustomMap from "../map/customMap";

const trunkStopStyle = {
    "--background": colorsByMode.TRUNK,
    "--light-background": "#FFE0D1",
};

class StopPoster extends Component {
    constructor(props) {
        super(props);

        this.onError = this.onError.bind(this);

        this.state = {
            template: null,
            hasRoutesOnTop: false,
            hasDiagram: true,
            hasRoutes: true,
            hasStretchedLeftColumn: false,
            shouldRenderFixedContent: false,
        };
    }

    componentWillMount() {
        renderQueue.add(this);
    }

    async componentDidMount() {
        if (this.props.template) {
            renderQueue.add(this);

            let templateReq;
            let templateBody = null;

            try {
                // This url will probably always be the same. If you find yourself
                // changing it, please make an .env setup while you're at it.
                templateReq = await window.fetch(`http://localhost:4000/templates/${this.props.template}`);
                templateBody = await templateReq.json();
            } catch (err) {
                this.onError(err);
            }

            this.setState({
                template: templateBody,
            });
        }

        renderQueue.onEmpty(error => !error && this.updateLayout(), { ignore: this });
    }

    componentDidUpdate() {
        renderQueue.onEmpty(error => !error && this.updateLayout(), { ignore: this });
    }

    componentWillUnmount() {
        if (this.mapMutationObserver) {
            this.mapMutationObserver.disconnect();
            this.mapMutationObserver = null;
        }
    }

    onError(error) {
        renderQueue.remove(this, { error: new Error(error) });
    }

    hasOverflow() {
        if (!this.content) {
            return false;
        }

        return (this.content.scrollWidth - this.content.clientWidth) > 1
               || (this.content.scrollHeight - this.content.clientHeight) > 1;
    }

    updateLayout() {
        if (!this.props.hasRoutes) {
            this.onError("No valid routes for stop");
            return;
        }

        if (this.hasOverflow() && this.state.shouldRenderFixedContent) {
            this.onError("Fixed content caused layout overflow");
            return;
        }

        if (this.hasOverflow()) {
            if (!this.state.hasRoutesOnTop) {
                this.setState({ hasRoutesOnTop: true });
                return;
            }
            if (this.state.hasDiagram) {
                this.setState({ hasDiagram: false });
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
            this.onError("Failed to remove layout overflow");
            return;
        }

        if (!this.state.shouldRenderFixedContent) {
            this.setState({ shouldRenderFixedContent: true });
            return;
        }

        window.setTimeout(() => {
            renderQueue.remove(this);
        }, 1000);
    }

    render() {
        if (!this.props.hasRoutes) {
            return null;
        }

        const { template } = this.state;

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
                            {this.state.hasRoutes && this.state.hasRoutesOnTop
                             && <Routes stopId={this.props.stopId} date={this.props.date}/>
                            }
                            {this.state.hasRoutes && this.state.hasRoutesOnTop
                             && <Spacer height={10}/>
                            }
                            <div className={styles.columns}>
                                <div
                                    className={this.state.hasStretchedLeftColumn
                                        ? styles.leftStretched : styles.left}
                                >
                                    {this.state.hasRoutes && !this.state.hasRoutesOnTop
                                     && <Routes stopId={this.props.stopId} date={this.props.date}/>
                                    }
                                    {this.state.hasRoutes && !this.state.hasRoutesOnTop
                                     && <Spacer height={10}/>
                                    }
                                    {this.state.hasDiagram
                                     && <StopPosterTimetable/>
                                    }
                                    {!this.state.hasDiagram
                                     && <StopPosterTimetable segments={["weekdays"]}/>
                                    }
                                    <div style={{ flex: 1 }} ref={(ref) => { this.ad = ref; }}>
                                        {this.state.shouldRenderFixedContent
                                         && (
                                             <AdContainer
                                                 template={template ? get(template, "areas", []).find(t => t.key === "ads") : {}}
                                                 width={this.ad.clientWidth}
                                                 height={this.ad.clientHeight}
                                                 shortId={this.props.shortId}
                                             />
                                         )
                                        }
                                    </div>
                                </div>

                                <Spacer width={10}/>

                                <div className={styles.right}>
                                    {!this.state.hasDiagram
                                     && (
                                         <div className={styles.timetables}>
                                             <StopPosterTimetable
                                                 segments={["saturdays"]}
                                                 hideDetails
                                             />
                                             <Spacer width={10}/>
                                             <StopPosterTimetable
                                                 segments={["sundays"]}
                                                 hideDetails
                                             />
                                         </div>
                                     )
                                    }

                                    {!this.state.hasDiagram && <Spacer height={10}/>}

                                    { this.state.shouldRenderFixedContent && (
                                        <CustomMap
                                            stopId={this.props.stopId}
                                            date={this.props.date}
                                            isSummerTimetable={this.props.isSummerTimetable}
                                            template={template ? get(template, "areas", []).find(t => t.key === "map") : null}
                                        />
                                    )}

                                    <Spacer height={10}/>

                                    {this.state.hasDiagram && !this.props.isTramStop
                                     && (
                                         <RouteDiagram
                                             stopId={this.props.stopId}
                                             date={this.props.date}
                                         />
                                     )
                                    }
                                    {this.state.hasDiagram && this.props.isTramStop
                                     && <TramDiagram/>
                                    }
                                </div>
                            </div>
                            <Spacer width="100%" height={62}/>
                        </div>
                        <Footer
                            onError={this.onError}
                            template={template ? get(template, "areas", []).find(t => t.key === "footer") : {}}
                            shortId={this.props.shortId}
                            isTrunkStop={this.props.isTrunkStop}
                        />
                        <Metadata date={this.props.date}/>
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
    isTramStop: PropTypes.bool.isRequired,
    shortId: PropTypes.string.isRequired,
    template: PropTypes.any.isRequired,
};

StopPoster.defaultProps = {
    isSummerTimetable: false,
    dateBegin: null,
    dateEnd: null,
};

export default hot(module)(StopPoster);
