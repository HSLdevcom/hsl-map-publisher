import React from 'react';
import PropTypes from 'prop-types';
import ItemContainer from 'components/labelPlacement/itemContainer';
import ItemFixed from 'components/labelPlacement/itemFixed';
import ItemPositioned from 'components/labelPlacement/itemPositioned';
import { Row, InlineSVG } from 'components/util';

import locationIcon from 'icons/marker.svg';

import aZone from 'icons/icon-Zone-A.svg';
import bZone from 'icons/icon-Zone-B.svg';
import cZone from 'icons/icon-Zone-C.svg';
import dZone from 'icons/icon-Zone-D.svg';

import MapCoordinateHelper from '../../util/mapCoordinateHelper';
import MapImage from './mapImageContainer';
import Scalebar from './scalebar';
import StopSymbol from './stopSymbol';
import StopLabel from './stopLabel';

import styles from './stopMap.css';

import placeLabelCity from './city-layer.json';

// Map symbol size
const STOP_RADIUS = 20;
const LOCATION_RADIUS = 30;
const LOCATION_RADIUS_MINI = 10;

// Overlays
const INFO_MARGIN_BOTTOM = 78;
const INFO_MARGIN_LEFT = 44;

const Attribution = () => <div className={styles.attribution}>&copy; OpenStreetMap</div>;

const LocationSymbol = props => (
  <div style={{ width: props.size, height: props.size }}>
    <InlineSVG src={locationIcon} style={{ width: '100%' }} />
  </div>
);

const getZoneIcon = zone => {
  switch (zone) {
    case 'A':
      return <InlineSVG src={aZone} style={{ width: '100%' }} />;
    case 'B':
      return <InlineSVG src={bZone} style={{ width: '100%' }} />;
    case 'C':
      return <InlineSVG src={cZone} style={{ width: '100%' }} />;
    case 'D':
      return <InlineSVG src={dZone} style={{ width: '100%' }} />;
    default:
      return <div />;
  }
};

const ZoneSymbol = props => (
  <div style={{ width: props.size, height: props.size }}>{getZoneIcon(props.zone)}</div>
);

LocationSymbol.propTypes = {
  size: PropTypes.number.isRequired,
};

ZoneSymbol.propTypes = {
  size: PropTypes.number.isRequired,
  zone: PropTypes.string.isRequired,
};

const StopMap = props => {
  const mapStyle = {
    width: props.mapOptions.width,
    height: props.mapOptions.height,
    mapZones: props.mapOptions.mapZones,
  };
  const miniMapStyle = {
    left: mapStyle.width - props.miniMapOptions.marginRight - props.miniMapOptions.width,
    top: mapStyle.height - props.miniMapOptions.marginBottom - props.miniMapOptions.height,
    width: props.miniMapOptions.width,
    height: props.miniMapOptions.height,
    zIndex: 20,
    minimapZones: props.miniMapOptions.minimapZones,
    minimapZoneSymbols: props.miniMapOptions.minimapZoneSymbols,
  };

  // Filter out stops that are behind the mini map
  const stops = props.nearbyStops.filter(
    stop => stop.x < miniMapStyle.left || stop.y < miniMapStyle.top,
  );

  const miniMapCoordinateHelper = new MapCoordinateHelper(props.miniMapOptions);
  const newPosition = miniMapCoordinateHelper.getMapCenter();
  const [miniMarkerOffsetLeft, miniMarkerOffsetTop] = miniMapCoordinateHelper.getCurrentPosition(
    newPosition.viewport,
  );

  return (
    <div className={styles.root} style={mapStyle}>
      <div className={styles.map}>
        <MapImage
          options={props.mapOptions}
          components={{
            text_fisv: { enabled: true },
            routes: { enabled: true },
            citybikes: { enabled: props.showCitybikes },
            print: { enabled: true },
            ticket_sales: { enabled: true },
            municipal_borders: { enabled: true },
            ticket_zones: { enabled: mapStyle.mapZones },
          }}
          date={props.date}
        />
      </div>

      <div className={styles.overlays}>
        <ItemContainer>
          {stops.map((stop, index) => (
            <ItemFixed key={index} top={stop.y - STOP_RADIUS} left={stop.x - STOP_RADIUS}>
              <StopSymbol routes={stop.routes} size={STOP_RADIUS * 2} />
            </ItemFixed>
          ))}

          <ItemFixed
            top={props.currentStop.y - STOP_RADIUS}
            left={props.currentStop.x - STOP_RADIUS}>
            <StopSymbol routes={props.currentStop.routes} size={STOP_RADIUS * 2} />
          </ItemFixed>

          <ItemFixed
            top={props.currentStop.y - 2 * LOCATION_RADIUS}
            left={props.currentStop.x - LOCATION_RADIUS}>
            <Row style={{ height: LOCATION_RADIUS * 2 }}>
              <LocationSymbol size={LOCATION_RADIUS * 2} />
              <div className={styles.title}>Olet tässä</div>
              <div className={styles.subtitle}>Du är här</div>
              <div className={styles.subtitle}>You are here</div>
            </Row>
          </ItemFixed>

          {props.projectedSymbols &&
            props.projectedSymbols.length > 0 &&
            props.projectedSymbols.map((symbol, index) => (
              <ItemPositioned key={index} x={symbol.sy} y={symbol.sx}>
                <ZoneSymbol zone={symbol.zone} size={LOCATION_RADIUS * 2} />
              </ItemPositioned>
            ))}

          {stops.map((stop, index) => (
            <ItemPositioned
              key={index}
              x={stop.x}
              y={stop.y}
              distance={25}
              angle={stop.calculatedHeading}>
              <StopLabel {...stop} />
            </ItemPositioned>
          ))}

          <ItemFixed top={mapStyle.height - INFO_MARGIN_BOTTOM} left={INFO_MARGIN_LEFT}>
            <div>
              <Scalebar targetWidth={250} pixelsPerMeter={props.pixelsPerMeter} />
              <Attribution />
            </div>
          </ItemFixed>

          <ItemFixed top={miniMapStyle.top} left={miniMapStyle.left}>
            <div style={miniMapStyle} />
          </ItemFixed>
        </ItemContainer>
      </div>

      <div className={styles.miniMap} style={miniMapStyle}>
        <MapImage
          options={{
            ...props.miniMapOptions,
            center: newPosition.mapCenter,
          }}
          components={{
            text: { enabled: false },
            print: { enabled: true },
            routes: { enabled: true, hideBusRoutes: true },
            municipal_borders: { enabled: true },
            ticket_zone_labels_minimap: { enabled: miniMapStyle.minimapZoneSymbols },
            ticket_zones: { enabled: miniMapStyle.minimapZones },
          }}
          extraLayers={[placeLabelCity]}
        />
        <div
          style={{
            marginLeft: -LOCATION_RADIUS_MINI,
            marginTop: -2 * LOCATION_RADIUS_MINI,
            top: miniMarkerOffsetTop,
            left: miniMarkerOffsetLeft,
            position: 'absolute',
          }}>
          <LocationSymbol size={LOCATION_RADIUS_MINI * 2} />
        </div>
      </div>
    </div>
  );
};

const StopType = PropTypes.shape({
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      routeId: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  stopIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  calculatedHeading: PropTypes.number,
});

StopMap.defaultProps = {
  projectedSymbols: null,
};

StopMap.propTypes = {
  mapOptions: PropTypes.shape(MapImage.optionsShape).isRequired,
  miniMapOptions: PropTypes.shape(MapImage.optionsShape).isRequired,
  currentStop: StopType.isRequired,
  nearbyStops: PropTypes.arrayOf(StopType).isRequired,
  pixelsPerMeter: PropTypes.number.isRequired,
  date: PropTypes.string.isRequired,
  showCitybikes: PropTypes.bool.isRequired,
  projectedSymbols: PropTypes.arrayOf(Object),
};

export default StopMap;
