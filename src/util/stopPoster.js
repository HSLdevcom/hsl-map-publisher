import { PerspectiveMercatorViewport } from 'viewport-mercator-project';
import FixedZoneSymbols from '../components/map/hsl-zones-publisher-v6.json';

const STOPS_PER_PIXEL = 0.000006;
const MAJOR_TRANSPORT_WEIGHT = 5;
const AVERAGE_DISTANCE_WEIGHT = 2;
const CURRENT_STOP_DISTANCE_WEIGHT = 1;
const ZOOM_WEIGHT = 1;
const STOP_AMOUNT_WEIGHT = 5;
const DISTANCES_FROM_CENTRE = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3];
const ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

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

  const projectedSymbols = [];
  if (useProjectedSymbols) {
    FixedZoneSymbols.features.forEach(feature => {
      feature.geometry.coordinates.forEach(coordinates => {
        const [sLon, sLat] = coordinates;
        if (sLat > maxLat && sLat < minLat && sLon > minLon && sLon < maxLon) {
          const [sy, sx] = bestViewPort.project([sLon, sLat]);
          projectedSymbols.push({ zone: feature.properties.Zone, sx, sy });
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
