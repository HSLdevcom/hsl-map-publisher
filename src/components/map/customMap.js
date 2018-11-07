import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import cheerio from 'cheerio';
import Measure from 'react-measure';
import StopMap from './stopMapContainer';
import { InlineSVG } from '../util';
import renderQueue from '../../util/renderQueue';
import { sizedSvg } from '../../util/sizedSvg';

const MAP_MIN_HEIGHT = 500;

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
    mapWidth: -1,
    mapHeight: -1,
  };

  componentDidMount() {
    renderQueue.add(this);
  }

  onResize = ({ client: { width, height } }) => {
    const { mapWidth, mapHeight } = this.state;
    const { setMapHeight } = this.props;

    // We only need one measurement
    if (mapWidth > -1 && mapHeight > -1) {
      return;
    }

    setMapHeight(height);

    this.setState(
      {
        mapWidth: width,
        mapHeight: height,
      },
      () => renderQueue.remove(this),
    );
  };

  render() {
    const { template, stopId, date, isSummerTimetable } = this.props;
    const { mapWidth, mapHeight } = this.state;

    /**
     * The template prop is a bit special.
     * template === null means the template hasn't loaded.
     * template === false means that there is no template
     * template == true means that we have a template.
     *
     * Only try to render the StopMap if template === false || !mapImage.
     * We don't want to unnecessarily mount the StopMap.
     */

    const mapImage = get(template, 'slots[0].image.svg', '');

    let svgHeight = 0;
    let svgSrc = 0;
    let mapImageStyle = {};
    let renderMap =
      (template === false || !mapImage) && mapHeight >= MAP_MIN_HEIGHT ? 'local' : 'none';

    // Make sure we have an svg image and a measurement before processing the svg
    if (mapImage && mapWidth > -1) {
      const { svg, width, height } = sizedSvg(mapImage, mapWidth);

      svgHeight = height;
      svgSrc = svg;

      if (svgSrc && svgHeight) {
        renderMap = 'svg';

        mapImageStyle = {
          width,
          height: svgHeight,
        };
      }
    }

    // Check if the svg fits with a 100px leeway
    if (renderMap === 'svg' && svgHeight > mapHeight + 100) {
      // Render the local map if the svg doesn't fit but the local map would fit
      renderMap = mapHeight >= MAP_MIN_HEIGHT ? 'local' : 'none';
    }

    // Aspect ratio height of SVG if one is set, auto otherwise.
    const wrapperHeight = renderMap === 'svg' ? svgHeight : 'auto';

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
            {renderMap === 'svg' ? (
              <InlineSVG style={mapImageStyle} src={svgSrc} />
            ) : renderMap === 'local' ? (
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
