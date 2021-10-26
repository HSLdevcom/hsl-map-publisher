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
import Timetable from 'components/timetable/timetableContainer';

import Header from './a3header';

import styles from './a3stopPoster.css';

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

class A3StopPoster extends Component {
  constructor(props) {
    super(props);

    this.onError = this.onError.bind(this);

    this.state = {
      template: null,
      hasRoutesOnTop: false,
      hasDiagram: true,
      hasStretchedLeftColumn: false,
      hasColumnTimetable: false,
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

  hasOverflow() {
    if (!this.content) {
      console.log('no content');
      return false;
    }
    // Horizontal overflow is not automatically resolvable.
    if (this.content.scrollWidth > this.content.clientWidth && this.state.hasRoutesOnTop) {
      this.onError('Unresolvable horizontal overflow detected.');
    }
    return this.content.scrollHeight > this.content.clientHeight;
  }

  updateLayout() {
    if (!this.props.hasRoutes) {
      this.onError('No valid routes for stop');
      return;
    }

    if (this.hasOverflow() || this.state.diagramOptions.binarySearching) {
      if (!this.state.hasStretchedLeftColumn) {
        this.setState({ hasStretchedLeftColumn: true });
        return;
      }

      if (this.state.hasDiagram) {
        // TODO: This is kind of dirty fix. Binarysearch to get acceptable
        // height for routetree.
        const { diagramOptions } = this.state;
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

      this.onError('Failed to remove layout overflow');
      return;
    }

    window.setTimeout(() => {
      renderQueue.remove(this);
    }, 1000);
  }

  render() {
    const {
      stopId,
      isTrunkStop,
      hasRoutes: hasRoutesProp,
      date,
      isSummerTimetable,
      dateBegin,
      dateEnd,
    } = this.props;

    if (!hasRoutesProp) {
      return null;
    }

    const { template, hasDiagram, hasStretchedLeftColumn, hasColumnTimetable } = this.state;

    const { isTramStop } = this.props;
    const src = get(template, 'areas', []).find(t => t.key === 'tram');
    const tramImage = get(src, 'slots[0].image.svg', '');
    let useDiagram = hasDiagram || (hasDiagram && isTramStop && !tramImage);
    if (isTramStop && tramImage) useDiagram = false;
    const printAsA3 = true;
    const StopPosterTimetable = props => (
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
        printAsA3={printAsA3}
      />
    );
    return (
      <CropMarks>
        <div className={styles.root} style={isTrunkStop ? trunkStopStyle : null}>
          <JustifiedColumn>
            <div
              className={styles.content}
              ref={ref => {
                this.content = ref;
              }}>
              <Header stopId={stopId} date={date} routeFilter={this.props.routeFilter} />
              <div className={styles.columns}>
                <div className={styles.left}>
                  {hasColumnTimetable && (
                    <StopPosterTimetable routeFilter={this.props.routeFilter} />
                  )}
                  {!hasColumnTimetable && (
                    <div className={styles.timetables}>
                      <StopPosterTimetable
                        segments={['weekdays']}
                        routeFilter={this.props.routeFilter}
                      />
                      <Spacer width={10} />
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
                </div>
                <Measure client>
                  {({
                    measureRef,
                    contentRect: {
                      client: { height: rightColumnHeight },
                    },
                  }) => (
                    <div className={styles.right} ref={measureRef}>
                      {useDiagram && (
                        <RouteDiagram
                          height={this.state.diagramOptions.diagramStopCount}
                          stopId={stopId}
                          date={date}
                          routeFilter={this.props.routeFilter}
                          printAsA3={printAsA3}
                        />
                      )}
                    </div>
                  )}
                </Measure>
              </div>
            </div>
          </JustifiedColumn>
        </div>
      </CropMarks>
    );
  }
}

A3StopPoster.propTypes = {
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
  routeFilter: PropTypes.string,
};

A3StopPoster.defaultProps = {
  isSummerTimetable: false,
  dateBegin: null,
  dateEnd: null,
  routeFilter: '',
};

export default hot(module)(A3StopPoster);
