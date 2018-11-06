import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import cheerio from 'cheerio';
import Measure from 'react-measure';
import StopMap from './stopMapContainer';
import { InlineSVG } from '../util';
import renderQueue from '../../util/renderQueue';

const MAP_MIN_HEIGHT = 500;
const parseAttr = attr => Math.round(parseInt(attr, 10));

class CustomMap extends Component {
  static propTypes = {
    stopId: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    // eslint-disable-next-line react/require-default-props
    isSummerTimetable: PropTypes.bool,
    // eslint-disable-next-line react/require-default-props
    template: PropTypes.any,
    setMapHeight: PropTypes.func.isRequired,
  };

  state = {
    mapImage: '',
    mapWidth: -1,
    mapHeight: -1,
  };

  componentDidMount() {
    renderQueue.add(this);
    this.updateTemplateImage();
  }

  componentDidUpdate() {
    this.updateTemplateImage();
  }

  // Used only if a static image replaces the local map.
  onResize = ({ client: { width, height } }) => {
    const { mapWidth, mapHeight } = this.state;
    const { setMapHeight } = this.props;

    // We only need one measurement
    if (mapWidth > -1 || mapHeight > -1) {
      return;
    }

    setMapHeight(height);

    this.setState(
      {
        mapWidth: width,
        mapHeight: height,
      },
      () => {
        renderQueue.remove(this);
      },
    );
  };

  updateTemplateImage() {
    const { mapImage } = this.state;
    const newMapImage = get(this.props, 'template.slots[0].image.svg', '');

    if (mapImage !== newMapImage) {
      this.setState({
        mapImage: newMapImage,
      });
    }
  }

  render() {
    const { stopId, date, isSummerTimetable } = this.props;

    const { mapImage, mapWidth, mapHeight } = this.state;

    let mapImageWidth = 0;
    let mapImageHeight = 0;
    let aspectRatio = 0;

    if (mapImage) {
      const $svg = cheerio.load(mapImage);

      if ($svg('svg').attr('width')) {
        mapImageWidth = parseAttr($svg('svg').attr('width'));
        mapImageHeight = parseAttr($svg('svg').attr('height'));
      } else {
        const svgViewBox = $svg('svg')
          .attr('viewBox')
          .split(' ');
        mapImageWidth = parseAttr(svgViewBox[2]);
        mapImageHeight = parseAttr(svgViewBox[3]);
      }

      aspectRatio = mapImageHeight / mapImageWidth;
    }

    const mapImageStyle = {
      width: mapWidth,
      height: mapWidth * aspectRatio,
    };

    // Aspect ratio height of SVG if one is set, auto otherwise.
    const wrapperHeight = aspectRatio > 0 ? mapWidth * aspectRatio : 'auto';

    return (
      <Measure client onResize={this.onResize}>
        {({ measureRef }) => (
          <div
            style={{
              flex: wrapperHeight === 'auto' ? 1 : 'none',
              width: '100%',
              height: wrapperHeight,
            }}
            ref={measureRef}>
            {mapImage ? (
              <InlineSVG style={mapImageStyle} src={mapImage} />
            ) : mapHeight >= MAP_MIN_HEIGHT ? (
              <StopMap
                stopId={stopId}
                date={date}
                width={mapWidth}
                height={mapHeight}
                showCitybikes={isSummerTimetable}
              />
            ) : null}
          </div>
        )}
      </Measure>
    );
  }
}

export default CustomMap;
