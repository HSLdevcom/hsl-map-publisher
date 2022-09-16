import { PerspectiveMercatorViewport } from 'viewport-mercator-project';
import TicketZones from '../components/map/ticket-zones.json';
import { groupBy } from 'lodash';
import * as turf from '@turf/turf';

const STOPS_PER_PIXEL = 0.000006;
const MAJOR_TRANSPORT_WEIGHT = 5;
const AVERAGE_DISTANCE_WEIGHT = 2;
const CURRENT_STOP_DISTANCE_WEIGHT = 1;
const ZOOM_WEIGHT = 1;
const STOP_AMOUNT_WEIGHT = 5;
const DISTANCES_FROM_CENTRE = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3];
const ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
const symbolSyOffset = 40;
const CIRCLE_RADIUS = 150;

function viewportContains(viewport, place, width, height, miniMapStartX, miniMapStartY) {
  const [x, y] = viewport.project([place.lon, place.lat], { topLeft: true });
  const behindMiniMap = x > miniMapStartX && height - y > miniMapStartY;
  return x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height && !behindMiniMap;
}

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

function getDistanceBetweenPoints(x, y, centerX, centerY) {
  return Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
}

function toDegrees(cx, cy, ex, ey) {
  const dy = ey - cy;
  const dx = ex - cx;
  let theta = Math.atan2(dy, dx); // range (-PI, PI]
  theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  // if (theta < 0) theta = 360 + theta; // range [0, 360)
  return theta;
}

function withinBounds(lat, lon, maxLat, minLat, maxLon, minLon) {
  return lat > maxLat && lat < minLat && lon > minLon && lon < maxLon;
}

function polygonContainsPoint(poly, point) {
  return turf.booleanContains(poly, point);
}

function getCoordinatesByAngle(mx, my, bestViewPort, angle) {
  const radians = toRadians(angle);
  const sy = mx + CIRCLE_RADIUS * Math.cos(radians);
  const sx = my + CIRCLE_RADIUS * Math.sin(radians);
  const [syLon, syLat] = bestViewPort.unproject([sy, sx]);
  return { sy, sx, syLon, syLat };
}

function calculateStopsViewport(options) {
  const {
    currentStopId,
    longitude,
    latitude,
    width,
    height,
    minZoom,
    maxZoom,
    stops,
    salePoints,
    miniMapStartX,
    miniMapStartY,
    useProjectedSymbols,
  } = options;
  // Nearby stops with labels plus current stop (no label)
  const maxStops = width * height * STOPS_PER_PIXEL + 1;

  const zoomLevels = [];
  for (let zoom = minZoom; zoom <= maxZoom; zoom += 0.1) {
    zoomLevels.push(zoom);
  }

  let bestViewPort = null;
  let bestViewPortScore = 0;
  let bestVisibleStops = [];
  const mapMidPoint = { x: width / 2, y: height / 2 };

  const allStops = stops.map(stop => ({
    ...stop,
    major: stop.routes.some(route => route.mode === 'SUBWAY' || route.mode === 'RAIL'),
  }));

  const defaultViewport = new PerspectiveMercatorViewport({
    longitude,
    latitude,
    width,
    height,
    zoom: maxZoom,
  });

  zoomLevels.forEach(zoom => {
    const baseViewport = new PerspectiveMercatorViewport({
      longitude,
      latitude,
      width,
      height,
      zoom,
    });
    DISTANCES_FROM_CENTRE.forEach(centreDistance => {
      ANGLES.forEach(angle => {
        const angleInRadian = toRadians(angle);
        const xDiff = Math.cos(angleInRadian) * centreDistance;
        const yDiff = Math.sin(angleInRadian) * centreDistance;
        const x = Math.floor(width / 2 + xDiff * width);
        const y = Math.floor(height / 2 + yDiff * height);
        const [lon, lat] = baseViewport.unproject([x, y]);

        const viewport = new PerspectiveMercatorViewport({
          longitude: lon,
          latitude: lat,
          width,
          height,
          zoom,
        });

        const visibleStops = allStops.filter(stop =>
          viewportContains(viewport, stop, width, height, miniMapStartX, miniMapStartY),
        );

        const currentStopIsVisible = visibleStops.some(s =>
          s.stopIds.some(sId => sId === currentStopId),
        );

        if (visibleStops.length <= maxStops && currentStopIsVisible && viewport) {
          const averagePoint = visibleStops
            .map(stop => {
              const [tX, tY] = viewport.project([stop.lon, stop.lat]);
              return { x: tX, y: tY };
            })
            .reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y }));
          averagePoint.x /= visibleStops.length;
          averagePoint.y /= visibleStops.length;

          const relativeAverageStopDistance =
            getDistanceBetweenPoints(averagePoint.x, averagePoint.y, mapMidPoint.x, mapMidPoint.y) /
            (Math.max(width, height) / 2);

          const currentStop = visibleStops.find(s => s.stopIds.some(sID => sID === currentStopId));

          const [tX, tY] = viewport.project([currentStop.lon, currentStop.lat]);
          const currentStopDistanceFromCenter = getDistanceBetweenPoints(
            tX,
            tY,
            mapMidPoint.x,
            mapMidPoint.y,
          );
          const relativeDistance = currentStopDistanceFromCenter / (Math.max(height, width) / 2);

          const visibleMajorStationsPoints = visibleStops.filter(stop => stop.major).length;

          let score = (visibleStops.length / maxStops) * STOP_AMOUNT_WEIGHT;
          score += ((zoom - minZoom) / (maxZoom - minZoom)) * ZOOM_WEIGHT;
          score += (Math.max(visibleMajorStationsPoints, 5) / 5) * MAJOR_TRANSPORT_WEIGHT;
          score += (1 - relativeAverageStopDistance) * AVERAGE_DISTANCE_WEIGHT;
          score += (1 - relativeDistance) * CURRENT_STOP_DISTANCE_WEIGHT;

          if (score > bestViewPortScore) {
            bestViewPortScore = score;
            bestViewPort = viewport;
            bestVisibleStops = visibleStops;
          }
        }
      });
    });
  });

  if (!bestViewPort) {
    bestViewPort = defaultViewport;
    console.log('Setting default viewport');
    bestVisibleStops = allStops.filter(stop =>
      viewportContains(defaultViewport, stop, width, height, miniMapStartX, miniMapStartY),
    );
  }

  // Calculate pixel coordinates for each stop
  const projectedStops = bestVisibleStops.map(stop => {
    const [x, y] = bestViewPort.project([stop.lon, stop.lat]);
    return { ...stop, x, y };
  });

  // Filter sale points that are in the map and calculate pixel coordinates for tem.
  const visibleSalePoints = salePoints.filter(sp =>
    viewportContains(bestViewPort, sp, width, height, miniMapStartX, miniMapStartY),
  );
  const projectedSalePoints = visibleSalePoints.map(sp => {
    const [x, y] = bestViewPort.project([sp.lon, sp.lat]);
    return { ...sp, x, y };
  });

  const [minLon, minLat] = bestViewPort.unproject([0, 0]);

  const [maxLon, maxLat] = bestViewPort.unproject([options.width, options.height]);

  const [x, y] = bestViewPort.project([longitude, latitude]);
  const projectedCurrentLocation = {
    x,
    y,
    lon: longitude,
    lat: latitude,
  };

  const leftTop = [minLon, minLat];
  const rightTop = [maxLon, minLat];
  const rightBottom = [maxLon, maxLat];
  const leftBottom = [minLon, maxLat];
  const bboxLine = turf.lineString([leftTop, rightTop, rightBottom, leftBottom, leftTop]);
  const bboxPolygon = turf.lineToPolygon(bboxLine);
  const ticketZonePolygons = TicketZones.features;

  const clippedPolygons = [];
  ticketZonePolygons.forEach(feature => {
    const clippedPolygon = turf.intersect(feature, bboxPolygon);
    if (clippedPolygon) {
      clippedPolygon.properties = { zone: feature.properties.Zone };
      clippedPolygons.push(clippedPolygon);
    }
  });

  const intersections = [];
  ticketZonePolygons.forEach(line => {
    const intersection = turf.lineIntersect(line, bboxLine);
    if (intersection.features.length > 0) {
      intersections.push(intersection);
    }
  });

  const zoneBorderLinesInBbox = [];
  const zonesInBbox = clippedPolygons.map(feature => feature.properties.zone);
  const ticketZoneLines = ticketZonePolygons.map(zone => turf.polygonToLine(zone));
  ticketZoneLines.forEach(line => {
    intersections.forEach(intersection => {
      const start = intersection.features[0];
      const stop = intersection.features[1];
      const sliced = turf.lineSlice(start, stop, line);
      const inBboxZones = zonesInBbox.includes(sliced.properties.Zone);
      let isEqual = false;
      zoneBorderLinesInBbox.forEach(zoneBorderLineInBbox => {
        if (inBboxZones && turf.booleanEqual(zoneBorderLineInBbox, sliced)) {
          isEqual = true;
        }
      });
      if (inBboxZones && !isEqual) {
        // To create extra midpoints for the zone border line we chunk linestring to linestrings of 0.1km
        // If the line is already shorter than 0.1km the original line is returned
        const lineChunks = turf.lineChunk(sliced, 0.1, { units: 'kilometers' });
        // MultiLinestring to featureCollection of points
        const allPoints = turf.explode(lineChunks);
        // Remove duplicate points that were created with lineChunk
        const uniquePoints = {};
        allPoints.features.forEach(feature => {
          const { coordinates } = feature.geometry;
          const key = `${coordinates[0]}${coordinates[1]}`;
          if (!uniquePoints[key]) {
            uniquePoints[key] = coordinates;
          }
        });
        // Set new coordinates as new geometry.
        // End and start points are the same as before (as in "sliced" variable) but there is more points along the line.
        const newCoordinates = Object.values(uniquePoints);
        sliced.geometry.coordinates = newCoordinates;
        zoneBorderLinesInBbox.push(sliced);
      }
    });
  });

  const projectedSymbols = [];
  const zoneSymbolObject = (zone, sx, sy, latLon) => ({
    zone,
    sx,
    sy: sy - symbolSyOffset,
    latLon,
  });

  if (useProjectedSymbols) {
    zoneBorderLinesInBbox.forEach(zoneBorderLineInBbox => {
      zoneBorderLineInBbox.geometry.coordinates.forEach((coordinates, index) => {
        const nextCoordinates = zoneBorderLineInBbox.geometry.coordinates[index + 1];
        let midCoordinates = null;
        if (nextCoordinates) {
          const midPoint = turf.midpoint(turf.point(coordinates), turf.point(nextCoordinates));
          midCoordinates = midPoint.geometry.coordinates;
        }
        if (
          midCoordinates &&
          withinBounds(midCoordinates[1], midCoordinates[0], maxLat, minLat, maxLon, minLon) &&
          withinBounds(coordinates[1], coordinates[0], maxLat, minLat, maxLon, minLon) &&
          withinBounds(nextCoordinates[1], nextCoordinates[0], maxLat, minLat, maxLon, minLon)
        ) {
          const [cx, cy] = bestViewPort.project(coordinates);
          const [ex, ey] = bestViewPort.project(nextCoordinates);
          const [mx, my] = bestViewPort.project(midCoordinates);

          // We calculate point for every degree around the zone line point so 360 coordinates for each zone line coordinate.
          const allsymbols = [];
          for (let i = 0; i < 360; i++) {
            const angle = toDegrees(cx, cy, ex, ey) + i;
            const symbolSpot = getCoordinatesByAngle(mx, my, bestViewPort, angle);
            ticketZonePolygons.forEach(ticketZone => {
              if (
                polygonContainsPoint(ticketZone, turf.point([symbolSpot.syLon, symbolSpot.syLat]))
              ) {
                symbolSpot.zone = ticketZone.properties.Zone;
                const distances = zoneBorderLinesInBbox.map(line =>
                  turf.pointToLineDistance(turf.point([symbolSpot.syLon, symbolSpot.syLat]), line, {
                    units: 'meters',
                  }),
                );
                const closest = Math.min(...distances);
                symbolSpot.distanceToZoneLine = closest;
                allsymbols.push(symbolSpot);
              }
            });
          }

          // Group the 360 coordinates by zone (e.g "A" and "B") and calculate distance to closest zone line coordinate
          // [{"A": [symbol1, symbol2, ...]}, {"B": [symbol1, symbol2, ...]}]
          const symbolsByZone = groupBy(allsymbols, 'zone');

          // Get point for each zone that is furthest away from zone line.
          const symbolsFurthestFromZoneLine = Object.keys(symbolsByZone).map(zone => {
            const symbols = symbolsByZone[zone];
            const furthestSymbol = symbols.reduce((prev, curr) =>
              prev.distanceToZoneLine > curr.distanceToZoneLine ? prev : curr,
            );
            return furthestSymbol;
          });
          symbolsFurthestFromZoneLine.forEach(symbol => {
            projectedSymbols.push(
              zoneSymbolObject(symbol.zone, symbol.sx, symbol.sy, [symbol.syLon, symbol.syLat]),
            );
          });
        }
      });
    });
  }

  return {
    projectedStops,
    viewport: bestViewPort,
    projectedCurrentLocation,
    minLon,
    minLat,
    maxLon,
    maxLat,
    projectedSymbols,
    projectedSalePoints,
  };
}

export {
  calculateStopsViewport, // eslint-disable-line import/prefer-default-export
};
