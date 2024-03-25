import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { hot } from 'react-hot-loader';
import { JustifiedColumn } from 'components/util';
import renderQueue from 'util/renderQueue';
import { colorsByMode } from 'util/domain';
import { chunk } from 'lodash';

import Timetable from 'components/a3Timetable/a3TimetableContainer';
import Header from './a3header';
import styles from './a3stopPoster.css';

const ROUTE_DIAGRAM_MAX_HEIGHT = 10;
const ROUTE_DIAGRAM_MIN_HEIGHT = 5;

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
    this.updateHook = this.updateHook.bind(this);
    this.state = {
      diagramOptions: defaultDiagramOptions,
      pageCount: 1,
    };
  }

  componentWillMount() {
    renderQueue.add(this);
  }

  componentDidMount() {
    this.updateLayout();
    renderQueue.onEmpty(error => !error && this.updateLayout(), {
      ignore: this,
    });
  }

  componentDidUpdate() {
    if (this.hasOverflow()) {
      this.updateLayout();
    }
    renderQueue.onEmpty(error => !error && this.updateLayout(), {
      ignore: this,
    });
  }

  onError(error) {
    renderQueue.remove(this, { error: new Error(error) });
  }

  updateHook = groupedRows => {
    const chunkedRows = chunk(groupedRows, 3);
    const pageCount = chunkedRows.length;

    this.setState({ groupedRows, pageCount });
    this.updateLayout();
  };

  updateLayout() {
    if (!this.props.hasRoutes) {
      this.onError('No valid routes for stop');
      return;
    }
    const overflow = this.hasOverflow();
    if (overflow.vertical || overflow.horizontal || this.state.diagramOptions.binarySearching) {
      if (overflow.vertical) {
        const { pageCount } = this.state;
        this.setState({
          pageCount: pageCount + 1,
        });
        return;
      }
      renderQueue.remove(this, { error: new Error('Failed to remove routes overflow') });
      return;
    }
    window.setTimeout(() => {
      renderQueue.remove(this);
    }, 1000);
  }

  hasOverflow() {
    if (!this.content) {
      console.log('no content');
      return false;
    }
    return {
      horizontal: this.content.scrollWidth > this.content.clientWidth,
      vertical: this.content.scrollHeight > this.content.clientHeight,
    };
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
        updateHook={props.updateHook}
        groupedRows={props.groupedRows}
        diagram={props.diagram}
      />
    );
    const containerStyle = {};
    if (isTrunkStop) {
      containerStyle['--background'] = colorsByMode.TRUNK;
      containerStyle['--light-background'] = '#FFE0D1';
    }
    containerStyle.height = `${841 * this.state.pageCount}px`;
    const diagram = {
      diagramOptions: this.state.diagramOptions,
      stopId,
      date,
      routeFilter: this.props.routeFilter,
      printAsA3,
    };
    return (
      <div
        className={styles.root}
        style={containerStyle}
        ref={ref => {
          this.content = ref;
        }}>
        <JustifiedColumn>
          <div className={styles.content}>
            <Header stopId={stopId} date={date} routeFilter={this.props.routeFilter} />
            <div className={styles.columns}>
              <div className={styles.timetablesContainer}>
                <div className={styles.timetables}>
                  <StopPosterTimetable
                    segments={['weekdays', 'saturdays', 'sundays']}
                    hideDetails
                    routeFilter={this.props.routeFilter}
                    updateHook={this.updateHook}
                    groupedRows={this.state.groupedRows}
                    diagram={diagram}
                  />
                </div>
                {/* <RouteDiagram
                    height={this.state.diagramOptions.diagramStopCount}
                    stopId={stopId}
                    date={date}
                    routeFilter={this.props.routeFilter}
                    printAsA3={printAsA3}
                  /> */}
              </div>
            </div>
          </div>
        </JustifiedColumn>
      </div>
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
