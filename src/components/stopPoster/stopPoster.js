import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { hot } from 'react-hot-loader';
import { get } from 'lodash';
import { JustifiedColumn, Spacer } from 'components/util';
import renderQueue from 'util/renderQueue';
import { colorsByMode } from 'util/domain';
import Measure from 'react-measure';

import CropMarks from 'components/cropMarks';
import RouteDiagram from 'components/routeDiagram/routeDiagramContainer';
import TramDiagram from 'components/tramDiagram/tramDiagram';
import Timetable from 'components/timetable/timetableContainer';
import Metadata from 'components/metadata';

import Header from './headerContainer';
import Footer from './footer';

import Routes from './routes';
import AdContainer from './adContainer';

import styles from './stopPoster.css';
import CustomMap from '../map/customMap';

const ROUTE_DIAGRAM_MAX_HEIGHT = 25;
const ROUTE_DIAGRAM_MIN_HEIGHT = 10;

const diagramConfig = {
  heightValues: Array.from(Array(ROUTE_DIAGRAM_MAX_HEIGHT - ROUTE_DIAGRAM_MIN_HEIGHT).keys()),
  middleHeightValue: null,
};

const trunkStopStyle = {
  '--background': colorsByMode.TRUNK,
  '--light-background': '#FFE0D1',
};

class StopPoster extends Component {
  constructor(props) {
    super(props);

    this.onError = this.onError.bind(this);
    this.setMapHeight = this.setMapHeight.bind(this);

    this.state = {
      routeDiagramStopCount: ROUTE_DIAGRAM_MAX_HEIGHT,
      mapHeight: -1,
      template: null,
      hasRoutesOnTop: false,
      hasDiagram: true,
      hasRoutes: true,
      hasStretchedLeftColumn: false,
      shouldRenderMap: false,
      triedRenderingMap: false,
      hasColumnTimetable: true,
      removedAds: null,
      adsPhase: false,
    };
  }

  componentWillMount() {
    renderQueue.add(this);
  }

  async componentDidMount() {
    if (this.props.template) {
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
    } else {
      this.setState({
        template: false,
      });
    }

    renderQueue.onEmpty(error => !error && this.updateLayout(), {
      ignore: this,
    });
  }

  componentDidUpdate() {
    renderQueue.onEmpty(error => !error && this.updateLayout(), {
      ignore: this,
    });
  }

  onError(error) {
    renderQueue.remove(this, { error: new Error(error) });
  }

  setMapHeight(mapHeight) {
    this.setState({
      mapHeight,
    });
  }

  hasOverflow() {
    if (!this.content) {
      return false;
    }
    // Horizontal overflow is not automatically resolvable.
    if (this.content.scrollWidth > this.content.clientWidth) {
      this.onError('Unresolvable horizontal overflow detected.');
    }
    return this.content.scrollHeight > this.content.clientHeight;
  }

  removeAdsFromTemplate(ads) {
    const { template } = this.state;
    const removedAds = [];
    ads.slots.forEach(slot => {
      if (slot.image) removedAds.push(slot);
    });
    template.areas.find(t => t.key === 'ads').slots = [];
    this.setState({
      removedAds,
      template,
    });
  }

  updateLayout() {
    if (!this.props.hasRoutes) {
      this.onError('No valid routes for stop');
      return;
    }

    if (this.hasOverflow() && this.state.triedRenderingMap) {
      this.onError('Unsolvable layout overflow.');
      return;
    }

    // Remove ads from template and try to add them later when there's no overflow.
    // i.e when this.state.adsPhase = true
    if (this.state.template && !this.state.removedAds) {
      const ads = get(this.state.template, 'areas', []).find(t => t.key === 'ads');
      if (ads.slots.length > 0) {
        this.removeAdsFromTemplate(ads);
        return;
      }
    }

    // Try adding ads one by one. Keep doing this untill removedAds is empty.
    // If we get overflow we remove ad from template.
    if (this.state.adsPhase) {
      const { template, removedAds } = this.state;
      const ads = get(template, 'areas', []).find(t => t.key === 'ads');
      if (this.hasOverflow()) {
        ads.slots.pop();
      } else {
        ads.slots.push(removedAds.pop());
        if (!removedAds || removedAds.length === 0) {
          this.setState({ adsPhase: false });
        }
      }
      template.areas.find(t => t.key === 'ads').slots = ads.slots;
      this.setState({
        template,
        removedAds,
      });
      return;
    }

    if (this.hasOverflow()) {
      if (!this.state.hasRoutesOnTop) {
        this.setState({ hasRoutesOnTop: true });
        return;
      }

      if (!this.state.hasStretchedLeftColumn) {
        this.setState({ hasStretchedLeftColumn: true });
        return;
      }

      if (this.state.hasDiagram) {
        if (this.state.routeDiagramStopCount >= ROUTE_DIAGRAM_MIN_HEIGHT) {
          // TODO: This is kind of dirty fix. Binarysearching first acceptable value
          // from the possible heightValues for diagram.
          let { routeDiagramStopCount } = this.state;
          const len = diagramConfig.heightValues.length;
          diagramConfig.heightValues = diagramConfig.heightValues.slice(Math.floor(len / 2), len);
          diagramConfig.middleHeightValue = diagramConfig.heightValues[Math.floor(len / 2)];
          routeDiagramStopCount = ROUTE_DIAGRAM_MAX_HEIGHT - diagramConfig.middleHeightValue;

          if (len === 1) {
            this.setState({ hasDiagram: false });
          }

          this.setState({
            routeDiagramStopCount,
          });
        } else {
          this.setState({ hasDiagram: false });
        }
        return;
      }

      if (this.state.hasColumnTimetable) {
        this.setState({
          hasColumnTimetable: false,
        });
        return;
      }

      if (this.state.hasRoutes) {
        this.setState({ hasRoutes: false });
        return;
      }

      if (this.state.shouldRenderMap) {
        // If map doesnt fit in we try adding routetree again.
        diagramConfig.heightValues = Array.from(
          Array(ROUTE_DIAGRAM_MAX_HEIGHT - ROUTE_DIAGRAM_MIN_HEIGHT).keys(),
        );
        diagramConfig.middleHeightValue = null;
        this.setState({
          shouldRenderMap: false,
          triedRenderingMap: true,
          hasDiagram: true,
          routeDiagramStopCount: ROUTE_DIAGRAM_MAX_HEIGHT,
        });
        return;
      }

      this.onError('Failed to remove layout overflow');
      return;
    }

    if (this.state.template && this.state.removedAds.length > 0) {
      this.setState({
        adsPhase: true,
      });
      return;
    }

    // If there is no layout overflow and the map is not rendered, try rendering the map again.
    if (!this.state.shouldRenderMap && !this.state.triedRenderingMap) {
      this.setState({ shouldRenderMap: true });
      return;
    }

    window.setTimeout(() => {
      renderQueue.remove(this);
    }, 1000);
  }

  render() {
    const {
      shortId,
      stopId,
      isTrunkStop,
      isTramStop,
      hasRoutes: hasRoutesProp,
      date,
      isSummerTimetable,
      dateBegin,
      dateEnd,
    } = this.props;

    if (!hasRoutesProp) {
      return null;
    }

    const {
      template,
      mapHeight,
      hasRoutesOnTop,
      hasDiagram,
      hasStretchedLeftColumn,
      hasRoutes,
      shouldRenderMap,
      hasColumnTimetable,
    } = this.state;

    const StopPosterTimetable = props => (
      <div className={styles.timetable}>
        <Timetable
          stopId={stopId}
          date={date}
          isSummerTimetable={isSummerTimetable}
          dateBegin={dateBegin}
          dateEnd={dateEnd}
          showValidityPeriod={!props.hideDetails}
          showNotes={!props.hideDetails}
          showComponentName={!props.hideDetails}
          segments={props.segments}
        />
      </div>
    );

    return (
      <CropMarks>
        <div className={styles.root} style={isTrunkStop ? trunkStopStyle : null}>
          <JustifiedColumn>
            <Header stopId={stopId} />
            <div
              className={styles.content}
              ref={ref => {
                this.content = ref;
              }}>
              <Spacer width="100%" height={50} />
              {hasRoutes && hasRoutesOnTop && <Routes stopId={stopId} date={date} />}
              {hasRoutes && hasRoutesOnTop && <Spacer height={10} />}
              <div className={styles.columns}>
                <div className={hasStretchedLeftColumn ? styles.leftStretched : styles.left}>
                  {hasRoutes && !hasRoutesOnTop && <Routes stopId={stopId} date={date} />}
                  {hasRoutes && !hasRoutesOnTop && <Spacer height={10} />}
                  {hasColumnTimetable && <StopPosterTimetable />}
                  {!hasColumnTimetable && <StopPosterTimetable segments={['weekdays']} />}
                  {/* The key will make sure the ad container updates its size if the layout changes */}
                  <AdContainer
                    key={`poster_ads_${hasRoutes}${hasRoutesOnTop}${hasStretchedLeftColumn}${hasDiagram}`}
                    shortId={shortId}
                    template={template ? get(template, 'areas', []).find(t => t.key === 'ads') : {}}
                  />
                </div>

                <Spacer width={10} />

                <Measure client>
                  {({
                    measureRef,
                    contentRect: {
                      client: { height: rightColumnHeight },
                    },
                  }) => (
                    <div className={styles.right} ref={measureRef}>
                      {!hasColumnTimetable && (
                        <div className={styles.timetables}>
                          <StopPosterTimetable segments={['saturdays']} hideDetails />
                          <Spacer width={10} />
                          <StopPosterTimetable segments={['sundays']} hideDetails />
                        </div>
                      )}
                      {!hasDiagram && <Spacer height={10} />}
                      {/* The key will make sure the map updates its size if the layout changes */}
                      {shouldRenderMap && (
                        <CustomMap
                          key={`poster_map_${hasDiagram}${isTramStop}`}
                          setMapHeight={this.setMapHeight}
                          stopId={stopId}
                          date={date}
                          isSummerTimetable={isSummerTimetable}
                          template={
                            template
                              ? get(template, 'areas', []).find(t => t.key === 'map')
                              : template // null if template is loading, false if no template
                          }
                        />
                      )}

                      <Spacer height={10} />
                      {hasDiagram &&
                        !isTramStop && (
                          <RouteDiagram
                            height={this.state.routeDiagramStopCount}
                            stopId={stopId}
                            date={date}
                          />
                        )}
                      {hasDiagram && isTramStop && <TramDiagram />}
                    </div>
                  )}
                </Measure>
              </div>
              <Spacer width="100%" height={62} />
            </div>
            <Footer
              onError={this.onError}
              template={template ? get(template, 'areas', []).find(t => t.key === 'footer') : {}}
              shortId={shortId}
              isTrunkStop={isTrunkStop}
            />
            <Metadata date={date} />
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
