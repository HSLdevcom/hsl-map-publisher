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

class TerminalPoster extends Component {
  constructor(props) {
    console.log(props);
    super(props);

    this.onError = this.onError.bind(this);
    this.setMapHeight = this.setMapHeight.bind(this);

    this.state = {
      mapHeight: -1,
      template: null,
      hasRoutesOnTop: true,
      hasRoutes: true,
      hasStretchedLeftColumn: false,
      shouldRenderMap: false,
      triedRenderingMap: false,
      hasColumnTimetable: false,
      hasTimetable: true,
      hasLeftColumn: true,
      removedAds: null,
      adsPhase: false,
      diagramOptions: defaultDiagramOptions,
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
      if (!this.state.hasStretchedLeftColumn) {
        this.setState({ hasStretchedLeftColumn: true });
        return;
      }

      if (this.state.hasColumnTimetable && this.state.hasTimetable) {
        this.setState({
          hasColumnTimetable: false,
        });
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

      if (this.state.hasTimetable) {
        this.setState({
          hasTimetable: false,
          hasLeftColumn: false,
        });
        return;
      }

      // This is dirty fix to wait a bit until to raise error.
      // Otherwise, the error will be raised before the map has been resized.
      window.setTimeout(() => {
        if (this.hasOverflow()) this.onError('Failed to remove layout overflow');
      }, 10000);

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
      terminalId,
      shortId,
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
      stops,
    } = this.props;

    if (!hasRoutesProp) {
      return null;
    }

    const {
      template,
      hasRoutesOnTop,
      hasStretchedLeftColumn,
      hasRoutes,
      shouldRenderMap,
      hasColumnTimetable,
      hasTimetable,
      hasLeftColumn,
    } = this.state;

    const { isTramStop } = this.props;
    const src = get(template, 'areas', []).find(t => t.key === 'tram');
    const tramImage = get(src, 'slots[0].image.svg', '');
    let useDiagram = true;

    if (isTramStop && tramImage) useDiagram = false;

    const TerminalPosterTimetable = props => (
      <React.Fragment>
        {stops.map(id => (
          <div className={styles.timetable} key={id}>
            <Timetable
              stopId={id}
              date={date}
              isSummerTimetable={isSummerTimetable}
              dateBegin={dateBegin}
              dateEnd={dateEnd}
              showValidityPeriod={!props.hideDetails}
              showNotes={!props.hideDetails}
              showComponentName={false}
              segments={props.segments}
              routeFilter={props.routeFilter}
              platformInfo
              showStopInformation
            />
          </div>
        ))}
      </React.Fragment>
    );

    return (
      <CropMarks>
        <div className={styles.root} style={isTrunkStop ? trunkStopStyle : null}>
          <JustifiedColumn>
            <Header stopId={terminalId} />
            <div
              className={styles.content}
              ref={ref => {
                this.content = ref;
              }}>
              <Spacer width="100%" height={50} />
              {hasRoutes && hasRoutesOnTop && (
                <Routes
                  stopIds={stops}
                  date={date}
                  routeFilter={this.props.routeFilter}
                  platformInfo
                />
              )}
              {hasRoutes && hasRoutesOnTop && <Spacer height={10} />}
              <div className={styles.columns}>
                {hasLeftColumn && (
                  <div className={hasStretchedLeftColumn ? styles.leftStretched : styles.left}>
                    {hasRoutes && !hasRoutesOnTop && (
                      <Routes
                        stopIds={stops}
                        date={date}
                        routeFilter={this.props.routeFilter}
                        platformInfo
                      />
                    )}
                    {hasRoutes && !hasRoutesOnTop && <Spacer height={10} />}
                    {hasTimetable && hasColumnTimetable && (
                      <TerminalPosterTimetable routeFilter={this.props.routeFilter} />
                    )}
                    {hasTimetable && !hasColumnTimetable && (
                      <TerminalPosterTimetable
                        segments={['weekdays', 'saturdays', 'sundays']}
                        routeFilter={this.props.routeFilter}
                      />
                    )}
                    {/* The key will make sure the ad container updates its size if the layout changes */}
                    <AdContainer
                      key={`poster_ads_${hasRoutes}${hasRoutesOnTop}${hasStretchedLeftColumn}${useDiagram}`}
                      shortId={shortId}
                      template={
                        template ? get(template, 'areas', []).find(t => t.key === 'ads') : {}
                      }
                    />
                  </div>
                )}

                <Spacer width={10} />

                <Measure client>
                  {({ measureRef, contentRect }) => (
                    <div className={styles.right} ref={measureRef}>
                      {!useDiagram && <Spacer height={10} />}
                      {/* The key will make sure the map updates its size if the layout changes */}
                      {shouldRenderMap && (
                        <CustomMap
                          key={`poster_map_${hasRoutes}${hasRoutesOnTop}${useDiagram}${isTramStop}${hasStretchedLeftColumn}${hasColumnTimetable}${hasTimetable}${hasLeftColumn}${contentRect.client.height}`}
                          setMapHeight={this.setMapHeight}
                          stopId={terminalId}
                          date={date}
                          isSummerTimetable={isSummerTimetable}
                          template={
                            template
                              ? get(template, 'areas', []).find(t => t.key === 'map')
                              : template // null if template is loading, false if no template
                          }
                          mapZoneSymbols={mapZoneSymbols}
                          mapZones={mapZones}
                          salesPoint={salesPoint}
                          minimapZoneSymbols={minimapZoneSymbols}
                          minimapZones={minimapZones}
                        />
                      )}

                      <Spacer height={10} />
                      {useDiagram && (
                        <RouteDiagram
                          height={this.state.diagramOptions.diagramStopCount}
                          stopIds={stops}
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

TerminalPoster.propTypes = {
  terminalId: PropTypes.string.isRequired,
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
  stops: PropTypes.array.isRequired,
};

TerminalPoster.defaultProps = {
  isSummerTimetable: false,
  dateBegin: null,
  dateEnd: null,
  mapZoneSymbols: false,
  mapZones: false,
  salesPoint: false,
  minimapZoneSymbols: false,
  minimapZones: false,
  routeFilter: '',
};

export default hot(module)(TerminalPoster);
