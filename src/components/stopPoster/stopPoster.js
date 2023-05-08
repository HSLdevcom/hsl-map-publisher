import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { hot } from 'react-hot-loader';
import { get, cloneDeep } from 'lodash';
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

const { PUBLISHER_SERVER_URL } = require('../../../constants');

const ROUTE_DIAGRAM_MAX_HEIGHT = 25;
const ROUTE_DIAGRAM_MIN_HEIGHT = 10;

const trunkStopStyle = {
  '--background': colorsByMode.TRUNK,
  '--light-background': '#FFE0D1',
};

const defaultDiagramOptions = {
  diagramStopCount: ROUTE_DIAGRAM_MAX_HEIGHT,
  heightValues: Array.from(Array(ROUTE_DIAGRAM_MAX_HEIGHT - ROUTE_DIAGRAM_MIN_HEIGHT).keys()),
  middleHeightValue: null,
  binarySearching: false,
};

class StopPoster extends Component {
  constructor(props) {
    super(props);

    this.onError = this.onError.bind(this);
    this.setMapHeight = this.setMapHeight.bind(this);

    this.state = {
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
      diagramOptions: defaultDiagramOptions,
    };
    renderQueue.add(this);
  }

  async componentDidMount() {
    if (this.props.template) {
      let templateReq;
      let templateBody = null;

      try {
        // This url will probably always be the same. If you find yourself
        // changing it, please make an .env setup while you're at it.
        templateReq = await window.fetch(
          `${PUBLISHER_SERVER_URL}/templates/${this.props.template}`,
        );
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
    if (this.content.scrollWidth > this.content.clientWidth && this.state.hasRoutesOnTop) {
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

      if (
        !removedAds ||
        removedAds.length === 0 ||
        (this.hasOverflow() && ads.slots.length === 0)
      ) {
        this.setState({ adsPhase: false });
      }

      if (this.hasOverflow()) {
        ads.slots.pop();
      } else {
        ads.slots.push(removedAds.pop());
      }

      template.areas.find(t => t.key === 'ads').slots = ads.slots;

      window.setTimeout(() => {
        this.setState({
          template,
          removedAds,
        });
      }, 1000);
      return;
    }

    if (this.hasOverflow() || this.state.diagramOptions.binarySearching) {
      if (!this.state.hasRoutesOnTop) {
        this.setState({ hasRoutesOnTop: true });
        return;
      }

      if (!this.state.hasStretchedLeftColumn) {
        this.setState({ hasStretchedLeftColumn: true });
        return;
      }

      if (this.state.hasDiagram) {
        // TODO: This is kind of dirty fix. Binarysearch to get acceptable
        // height for routetree.
        const { diagramOptions } = this.state;

        if (diagramOptions.heightValues.length === 0) {
          this.setState({ hasDiagram: false });
          return;
        }
        diagramOptions.binarySearching = true;
        diagramOptions.middleHeightValue =
          diagramOptions.heightValues[Math.floor(diagramOptions.heightValues.length / 2)];
        const prevCount = diagramOptions.diagramStopCount;
        diagramOptions.diagramStopCount =
          ROUTE_DIAGRAM_MAX_HEIGHT - diagramOptions.middleHeightValue;

        if (this.hasOverflow()) {
          if (diagramOptions.heightValues.length === 1) diagramOptions.heightValues = [];
          diagramOptions.heightValues = diagramOptions.heightValues.slice(
            Math.floor(diagramOptions.heightValues.length / 2),
            diagramOptions.heightValues.length,
          );
        } else {
          diagramOptions.latestFittingCount = prevCount;
          diagramOptions.heightValues = diagramOptions.heightValues.slice(
            0,
            Math.floor(diagramOptions.heightValues.length / 2),
          );
        }
        if (this.hasOverflow() && diagramOptions.latestFittingCount) {
          diagramOptions.diagramStopCount = diagramOptions.latestFittingCount;
          diagramOptions.binarySearching = false;
        }

        if (diagramOptions.heightValues.length < 1) {
          diagramOptions.binarySearching = false;
          if (!diagramOptions.latestFittingCount) {
            this.setState({ hasDiagram: false });
          }
        }

        this.setState({ diagramOptions });
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

      const template = cloneDeep(this.state.template);
      const mapTemplate = template
        ? get(template, 'areas', []).find(t => t.key === 'map' || t.key === 'tram')
        : null;
      if (mapTemplate) {
        for (let i = 0; i < template.areas.length; i++) {
          const area = template.areas[i];
          if (area.key === 'map' || area.key === 'tram') {
            template.areas.splice(i, 1);
            break;
          }
        }
        this.setState({ template });
        return;
      }

      if (this.state.shouldRenderMap) {
        //  If map don't fit try fill available space with diagram.
        this.setState({
          shouldRenderMap: false,
          triedRenderingMap: true,
          hasDiagram: true,
          diagramOptions: defaultDiagramOptions,
        });
        return;
      }

      this.onError('Failed to remove layout overflow');
      return;
    }

    if (this.hasOverflow() && this.state.triedRenderingMap) {
      this.onError('Unsolvable layout overflow.');
      return;
    }

    if (this.state.template && this.state.removedAds.length > 0) {
      const { template } = this.state;
      const svg = get(template, 'areas', []).find(t => t.key === 'map').slots[0];
      //  If using svg postpone adsPhase untill we have mapHeight.
      if (!svg.image) {
        this.setState({ adsPhase: true });
        return;
      }

      if (svg.image && this.state.mapHeight > -1) {
        this.setState({ adsPhase: true });
        return;
      }
    }

    //  If there is no layout overflow and the map is not rendered, try rendering the map again.
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
      hasRoutes: hasRoutesProp,
      date,
      isSummerTimetable,
      dateBegin,
      dateEnd,
      mapZoneSymbols,
      mapZones,
      salesPoint,
      minimapZoneSymbols,
      minimapZones,
      legend,
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

    const { isTramStop } = this.props;
    const src = get(template, 'areas', []).find(t => t.key === 'tram');
    const tramImage = get(src, 'slots[0].image.svg', '');
    let useDiagram = hasDiagram || (hasDiagram && isTramStop && !tramImage);
    if (isTramStop && tramImage) useDiagram = false;

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
          routeFilter={props.routeFilter}
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
              {hasRoutes && hasRoutesOnTop && (
                <Routes stopId={stopId} date={date} routeFilter={this.props.routeFilter} />
              )}
              {hasRoutes && hasRoutesOnTop && <Spacer height={10} />}
              <div className={styles.columns}>
                <div className={hasStretchedLeftColumn ? styles.leftStretched : styles.left}>
                  {hasRoutes && !hasRoutesOnTop && (
                    <Routes stopId={stopId} date={date} routeFilter={this.props.routeFilter} />
                  )}
                  {hasRoutes && !hasRoutesOnTop && <Spacer height={10} />}
                  {hasColumnTimetable && (
                    <StopPosterTimetable routeFilter={this.props.routeFilter} />
                  )}
                  {!hasColumnTimetable && (
                    <StopPosterTimetable
                      segments={['weekdays']}
                      routeFilter={this.props.routeFilter}
                    />
                  )}
                  {/* The key will make sure the ad container updates its size if the layout changes */}
                  <AdContainer
                    key={`poster_ads_${hasRoutes}${hasRoutesOnTop}${hasStretchedLeftColumn}${useDiagram}`}
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
                          <StopPosterTimetable
                            segments={['saturdays']}
                            hideDetails
                            routeFilter={this.props.routeFilter}
                          />
                          <Spacer width={10} />
                          <StopPosterTimetable
                            segments={['sundays']}
                            hideDetails
                            routeFilter={this.props.routeFilter}
                          />
                        </div>
                      )}
                      {!useDiagram && <Spacer height={10} />}
                      {/* The key will make sure the map updates its size if the layout changes */}
                      {shouldRenderMap && (
                        <CustomMap
                          key={`poster_map_${hasRoutes}${hasRoutesOnTop}${useDiagram}${isTramStop}${hasStretchedLeftColumn}${hasColumnTimetable}`}
                          setMapHeight={this.setMapHeight}
                          stopId={stopId}
                          date={date}
                          isSummerTimetable={isSummerTimetable}
                          template={
                            template
                              ? get(template, 'areas', []).find(t => t.key === 'map')
                              : template // null if template is loading, false if no template
                          }
                          mapZoneSymbols={mapZoneSymbols}
                          mapZones={mapZones}
                          showSalesPoint={salesPoint}
                          minimapZoneSymbols={minimapZoneSymbols}
                          minimapZones={minimapZones}
                          legend={legend}
                        />
                      )}

                      <Spacer height={10} />
                      {useDiagram && (
                        <RouteDiagram
                          height={this.state.diagramOptions.diagramStopCount}
                          stopIds={[stopId]}
                          date={date}
                          routeFilter={this.props.routeFilter}
                        />
                      )}
                      {isTramStop && tramImage && <TramDiagram svg={tramImage} />}
                    </div>
                  )}
                </Measure>
              </div>
              <Spacer width="100%" height={50} />
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
  mapZoneSymbols: PropTypes.bool,
  mapZones: PropTypes.bool,
  salesPoint: PropTypes.bool,
  minimapZoneSymbols: PropTypes.bool,
  minimapZones: PropTypes.bool,
  routeFilter: PropTypes.string,
  legend: PropTypes.bool,
};

StopPoster.defaultProps = {
  isSummerTimetable: false,
  dateBegin: null,
  dateEnd: null,
  mapZoneSymbols: false,
  mapZones: false,
  salesPoint: false,
  minimapZoneSymbols: false,
  minimapZones: false,
  routeFilter: '',
  legend: false,
};

export default hot(module)(StopPoster);
