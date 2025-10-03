import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import find from 'lodash/find';
import ItemContainer from 'components/labelPlacement/itemContainer';
import ItemFixed from 'components/labelPlacement/itemFixed';
import ItemPositioned from 'components/labelPlacement/itemPositioned';
import { Row } from 'components/util';
import InlineSVG from 'components/inlineSVG';

import locationIcon from 'icons/marker.svg';
import subwayStationIcon from 'icons/icon-subway-station.svg';
import ticketMachineIcon from 'icons/icon-ticket-machine.svg';
import ticketSalesPointIcon from 'icons/icon-tickets-sales-point.svg';

import aZone from 'icons/icon-Zone-A.svg';
import bZone from 'icons/icon-Zone-B.svg';
import cZone from 'icons/icon-Zone-C.svg';
import dZone from 'icons/icon-Zone-D.svg';

import MapCoordinateHelper from '../../util/mapCoordinateHelper';
import MapImage from './mapImageContainer';
import Scalebar from './scalebar';
import StopSymbol from './stopSymbol';
import StopLabel from './stopLabel';
import SalePointLabel from './salePointLabel';

import styles from './stopMap.css';

import placeLabelCity from './city-layer.json';

// Map symbol size
const SALES_POINT_RADIUS = 9;
const STOP_RADIUS = 20;
const LOCATION_RADIUS = 30;
const LOCATION_RADIUS_MINI = 10;
const ZONE_SYMBOL_MAP_PADDING = 100;
const ZONE_SYMBOL_MAP_PADDING_EXTRA = 200;

// Overlays
const INFO_MARGIN_BOTTOM = 78;
const INFO_MARGIN_LEFT = 44;

const Attribution = () => <div className={styles.attribution}>&copy; OpenStreetMap</div>;

const LocationSymbol = props => (
  <div style={{ width: props.size, height: props.size }}>
    <InlineSVG src={locationIcon} style={{ width: '100%' }} />
  </div>
);

const getSalesPointIcon = type => (
  <InlineSVG
    fitToSize
    src={type.toLowerCase() === 'myyntipiste' ? ticketSalesPointIcon : ticketMachineIcon}
  />
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
    case 'D1':
      return <InlineSVG src={dZone} style={{ width: '100%' }} />;
    case 'D2':
      return <InlineSVG src={dZone} style={{ width: '100%' }} />;
    default:
      return <div />;
  }
};

const ZoneLabel = () => (
  <div className={styles.zoneHeading}>
    <span>
      <strong>Vyöhyke</strong> Zon/Zone
    </span>
  </div>
);

const ZoneSymbol = props => (
  <Row>
    <div className={styles.zoneSymbol}>{getZoneIcon(props.zone)}</div>
    <ZoneLabel />
  </Row>
);

LocationSymbol.propTypes = {
  size: PropTypes.number.isRequired,
};

ZoneSymbol.propTypes = {
  size: PropTypes.number.isRequired,
  zone: PropTypes.string.isRequired,
};

const getSymbolForEachZone = projectedSymbolsWithDistance => {
  const zones = [];
  const uniqueSymbols = [];
  projectedSymbolsWithDistance.forEach(symbol => {
    if (!zones || !zones.includes(symbol.zone)) {
      zones.push(symbol.zone);
      uniqueSymbols.push(symbol);
    }
  });
  return uniqueSymbols;
};

const calculateSymbolDistancesFromStops = (stops, symbols) => {
  const symbolsWithStopDistances = symbols.map(symbol => {
    const stopDistances = stops.map(stop => {
      const xDif = Math.abs(symbol.sy - stop.x);
      const yDif = Math.abs(symbol.sx - stop.y);
      return yDif + xDif;
    });
    stopDistances.sort((a, b) => a - b);
    const newSymbol = symbol;
    const distanceToNearestStop = stopDistances[0];
    newSymbol.distanceToClosestStop = distanceToNearestStop;
    return newSymbol;
  });
  symbolsWithStopDistances.sort((a, b) =>
    a.distanceToClosestStop < b.distanceToClosestStop ? 1 : -1,
  );

  return symbolsWithStopDistances;
};

const getLegend = (stops, projectedSalesPoints, subwayEntrances) => {
  const modes = [];
  stops.forEach(stop => {
    stop.routes.forEach(route => {
      const { mode } = route;
      if (mode && !modes.includes(mode)) {
        modes.push(mode);
      }
      if (route.trunkRoute && !modes.includes('TRUNK')) {
        modes.push('TRUNK');
      }
    });
  });

  const legendContent = modes.map(mode => {
    switch (mode) {
      case 'BUS':
        return (
          <div key={mode} className={styles.legendRow}>
            <div className={classNames(styles.legendLine, styles.bus)} />
            <div className={classNames(styles.legendIcon, styles.bus)} />
            <div className={styles.legendText}>
              <span className={styles.primaryLegendText}>Bussi</span> / <span>Buss</span>
              {' / '}
              <span className={styles.italics}>Bus</span>
            </div>
          </div>
        );
      case 'TRAM':
        return (
          <div key={mode} className={styles.legendRow}>
            <div className={classNames(styles.legendLine, styles.tram)} />
            <div className={classNames(styles.legendIcon, styles.tram)} />
            <div className={styles.legendText}>
              <span className={styles.primaryLegendText}>Raitiovaunu</span> / <span>Spårvagn</span>
              {' / '}
              <span className={styles.italics}>Tram</span>
            </div>
          </div>
        );
      case 'SUBWAY':
        return (
          <div key={mode} className={styles.legendRow}>
            <div className={classNames(styles.legendLine, styles.subway)} />
            <div className={classNames(styles.legendIcon, styles.subway)} />
            <div className={styles.legendText}>
              <span className={styles.primaryLegendText}>Metro</span>
            </div>
          </div>
        );
      case 'RAIL':
        return (
          <div key={mode} className={styles.legendRow}>
            <div className={classNames(styles.legendLine, styles.rail)} />
            <div className={classNames(styles.legendIcon, styles.rail)} />
            <div className={styles.legendText}>
              <span className={styles.primaryLegendText}>Juna</span> / <span>Tåg</span>
              {' / '}
              <span className={styles.italics}>Rail</span>
            </div>
          </div>
        );
      case 'TRUNK':
        return (
          <div key={mode} className={styles.legendRow}>
            <div className={classNames(styles.legendLine, styles.trunk)} />
            <div className={classNames(styles.legendIcon, styles.trunk)} />
            <div className={styles.legendText}>
              <span className={styles.primaryLegendText}>Runkolinja</span> / <span>Stomlinjen</span>
              {' / '}
              <span className={styles.italics}>Trunk route</span>
            </div>
          </div>
        );
      case 'L_RAIL':
        return (
          <div key={mode} className={styles.legendRow}>
            <div className={classNames(styles.legendLine, styles.l_rail)} />
            <div className={classNames(styles.legendIcon, styles.l_rail)} />
            <div className={styles.legendText}>
              <span className={styles.primaryLegendText}>Pikaratikka</span>
              {' / '}
              <span>Snabbspårvagn</span>
              {' / '}
              <span className={styles.italics}>Light rail</span>
            </div>
          </div>
        );
      default:
        return '';
    }
  });

  let legendHeight = legendContent.length * 25;

  const svgStyles = {
    display: 'block',
    width: '20px',
    height: '20px',
  };

  if (subwayEntrances) {
    const subwayEntrance = find(subwayEntrances, ['type', 'subway_entrance']);
    if (subwayEntrance) {
      legendHeight += 30;
      legendContent.push(
        <div key={subwayEntrance.type} className={styles.legendRow}>
          <InlineSVG style={svgStyles} src={subwayStationIcon} />
          <div className={styles.legendText}>
            <span className={styles.primaryLegendText}>Metron sisäänkäynti</span>
            {' / '}
            <span>Metrons ingång</span>
            {' / '}
            <span className={styles.italics}>Metro entrance</span>
          </div>
        </div>,
      );
    }
  }

  if (projectedSalesPoints) {
    const ticketSalesPoint = find(projectedSalesPoints, ['type', 'Myyntipiste']);
    const ticketSalesMachine = find(projectedSalesPoints, ['type', 'Monilippuautomaatti']);
    if (ticketSalesPoint) {
      legendHeight += 30;
      legendContent.push(
        <div key="Myyntipiste" className={styles.legendRow}>
          <InlineSVG style={svgStyles} src={ticketSalesPointIcon} />
          <div className={styles.legendText}>
            <span className={styles.primaryLegendText}>Lipunmyyntipiste</span>
            {' / '}
            <span>Biljettförsäljning</span>
            {' / '}
            <span className={styles.italics}>Ticket sales</span>
          </div>
        </div>,
      );
    }
    if (ticketSalesMachine) {
      legendHeight += 30;
      legendContent.push(
        <div key="Monilippuautomaatti" className={styles.legendRow}>
          <InlineSVG style={svgStyles} src={ticketMachineIcon} />
          <div className={styles.legendText}>
            <span className={styles.primaryLegendText}>Lippuautomaatti</span>
            {' / '}
            <span>Biljettautomat</span>
            {' / '}
            <span className={styles.italics}>Ticket sales machine</span>
          </div>
        </div>,
      );
    }
  }

  legendHeight += 100; // Offset, scaleBar and attribution

  return {
    content: legendContent,
    height: legendHeight,
  };
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

  // Filter out zone symbols that are behind the mini map
  // Added extra buffed width because zone symbols might be cut half by minimap
  const projectedSymbols = props.projectedSymbols.filter(
    symbol =>
      symbol.sx < miniMapStyle.top - ZONE_SYMBOL_MAP_PADDING ||
      symbol.sy < miniMapStyle.left - ZONE_SYMBOL_MAP_PADDING_EXTRA,
  );

  // Avoid map edges so zone symbol and text is fully visible
  const projectedSymbolsInBbox = projectedSymbols.filter(
    symbol =>
      symbol.sy > ZONE_SYMBOL_MAP_PADDING &&
      symbol.sx > ZONE_SYMBOL_MAP_PADDING &&
      symbol.sy < mapStyle.width - ZONE_SYMBOL_MAP_PADDING_EXTRA &&
      symbol.sx < mapStyle.height - ZONE_SYMBOL_MAP_PADDING,
  );
  const symbolsWithStopDistances = calculateSymbolDistancesFromStops(
    stops.concat(props.currentStop),
    projectedSymbolsInBbox,
  );

  const symbolForEachZone = getSymbolForEachZone(symbolsWithStopDistances);

  const miniMapCoordinateHelper = new MapCoordinateHelper(props.miniMapOptions);
  const newPosition = miniMapCoordinateHelper.getMapCenter();
  const [miniMarkerOffsetLeft, miniMarkerOffsetTop] = miniMapCoordinateHelper.getCurrentPosition(
    newPosition.viewport,
  );

  const { nearestSalePoint, isTerminal } = props;
  const salesPointIcon = nearestSalePoint && getSalesPointIcon(nearestSalePoint.type);

  const legend = getLegend(stops, props.projectedSalesPoints, props.subwayEntrances);

  const legendStyle = {
    left: mapStyle.width - props.miniMapOptions.marginRight - props.miniMapOptions.width - 300,
    top: mapStyle.height - legend.height,
  };

  return (
    <div className={styles.root} style={mapStyle}>
      <div className={styles.map}>
        <MapImage
          options={props.mapOptions}
          components={{
            municipal_borders: { enabled: true },
            routes: { enabled: true },
            subway_entrance: { enabled: true },
            citybikes: { enabled: props.showCitybikes },
            ticket_zones: { enabled: mapStyle.mapZones },
            text_fisv: { enabled: true },
            print: { enabled: true },
          }}
          date={props.date}
        />
      </div>

      <div className={styles.overlays}>
        <ItemContainer>
          {stops.map((stop, index) => (
            <ItemFixed key={index} top={stop.y - STOP_RADIUS} left={stop.x - STOP_RADIUS}>
              <StopSymbol
                platform={stop.stops.nodes[0].platform}
                routes={stop.routes}
                size={STOP_RADIUS * 2}
              />
            </ItemFixed>
          ))}

          {!isTerminal && (
            <ItemFixed
              top={props.currentStop.y - STOP_RADIUS}
              left={props.currentStop.x - STOP_RADIUS}>
              <StopSymbol
                platform={props.currentStop.stops.nodes[0].platform}
                routes={props.currentStop.routes}
                size={STOP_RADIUS * 2}
              />
            </ItemFixed>
          )}

          {!isTerminal && (
            <ItemFixed
              top={props.currentStop.y - 2.2 * LOCATION_RADIUS}
              left={props.currentStop.x - LOCATION_RADIUS}>
              <Row style={{ height: LOCATION_RADIUS * 2 }}>
                <LocationSymbol size={LOCATION_RADIUS * 2} />
                <div className={styles.title}>Olet tässä</div>
                <div className={styles.subtitle}>Du är här</div>
                <div className={styles.subtitle}>You are here</div>
              </Row>
            </ItemFixed>
          )}

          {symbolForEachZone &&
            symbolForEachZone.length > 0 &&
            symbolForEachZone.map((symbol, index) => (
              <ItemFixed key={index} left={symbol.sy} top={symbol.sx}>
                <ZoneSymbol zone={symbol.zone} size={LOCATION_RADIUS * 2} />
              </ItemFixed>
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

          {nearestSalePoint && (
            <ItemFixed
              top={nearestSalePoint.y - SALES_POINT_RADIUS}
              left={nearestSalePoint.x - SALES_POINT_RADIUS}>
              <Row>
                <div style={{ width: SALES_POINT_RADIUS * 2, height: SALES_POINT_RADIUS * 2 }}>
                  {salesPointIcon}
                </div>
              </Row>
            </ItemFixed>
          )}

          {nearestSalePoint && (
            <ItemPositioned x={nearestSalePoint.x} y={nearestSalePoint.y} distance={25} angle={0}>
              <Row>
                <SalePointLabel {...nearestSalePoint} icon={salesPointIcon} />
              </Row>
            </ItemPositioned>
          )}

          {legend.content.length > 1 && props.legend && (
            <ItemFixed top={legendStyle.top} left={10}>
              <div className={styles.legend}>{legend.content}</div>
            </ItemFixed>
          )}

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
            text: { enabled: true },
            text_fisv: { enabled: true },
            print: { enabled: true },
            routes: { enabled: true, hideBusRoutes: true },
            municipal_borders: { enabled: true },
            ticket_zone_labels: { enabled: miniMapStyle.minimapZoneSymbols },
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
  ),
  stopIds: PropTypes.arrayOf(PropTypes.string.isRequired),
  calculatedHeading: PropTypes.number,
  stops: PropTypes.array,
});

const nearestSalePointType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  address: PropTypes.string,
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  distance: PropTypes.number.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
});

StopMap.defaultProps = {
  projectedSymbols: null,
  nearestSalePoint: null,
  isTerminal: false,
  projectedSalesPoints: null,
  subwayEntrances: null,
  legend: false,
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
  nearestSalePoint: nearestSalePointType,
  isTerminal: PropTypes.bool,
  projectedSalesPoints: PropTypes.arrayOf(Object),
  subwayEntrances: PropTypes.arrayOf(Object),
  legend: PropTypes.bool,
};

export default StopMap;
