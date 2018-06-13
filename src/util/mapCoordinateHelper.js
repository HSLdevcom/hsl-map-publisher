import viewportMercator from "viewport-mercator-project";

const SOUTHERNMOST_LINE = {
    start: {
        lon: 24.40,
        lat: 59.97,
    },
    end: {
        lon: 25.69,
        lat: 60.26,
    },
};

function isSouthOfSouthernmostLine([lon, lat]) {
    return (
        (lon - SOUTHERNMOST_LINE.start.lon)
        *
        (SOUTHERNMOST_LINE.end.lat - SOUTHERNMOST_LINE.start.lat)
    ) - (
        (lat - SOUTHERNMOST_LINE.start.lat)
        *
        (SOUTHERNMOST_LINE.end.lon - SOUTHERNMOST_LINE.start.lon)
    ) > 0;
}

function getNewBottomMostPoint(lon) {
    const slope = (SOUTHERNMOST_LINE.end.lat - SOUTHERNMOST_LINE.start.lat)
    /
    (SOUTHERNMOST_LINE.end.lon - SOUTHERNMOST_LINE.start.lon);

    return ((lon - SOUTHERNMOST_LINE.start.lon) * slope)
    + SOUTHERNMOST_LINE.start.lat;
}

export default class MapCoordinateHelper {
    constructor(options) {
        this.viewport = viewportMercator({
            longitude: options.center[0],
            latitude: options.center[1],
            zoom: options.zoom,
            width: options.width,
            height: options.height,
        });

        const [lon, lat] = options.center;
        this.mapOptions = options;
        this.initialLongitude = lon;
        this.initialLatitude = lat;
    }

    getMapCenter() {
        const initialBottomPoint =
            this.viewport.unproject([this.mapOptions.width / 2, this.mapOptions.height]);

        let mapCenter = null;

        if (isSouthOfSouthernmostLine(initialBottomPoint)) {
            const mapHeight =
                this.viewport.unproject([0, 0])[1]
                - this.viewport.unproject([0, this.mapOptions.height])[1];

            mapCenter = [
                this.initialLongitude,
                (getNewBottomMostPoint(this.initialLongitude) + (mapHeight / 2)),
            ];
        } else {
            mapCenter = [this.initialLongitude, this.initialLatitude];
        }

        const newViewPort = viewportMercator({
            longitude: mapCenter[0],
            latitude: mapCenter[1],
            zoom: this.mapOptions.zoom,
            width: this.mapOptions.width,
            height: this.mapOptions.height,
        });

        return {
            mapCenter,
            viewport: newViewPort,
        };
    }

    getCurrentPosition(viewport) {
        return viewport.project([this.initialLongitude, this.initialLatitude]);
    }
}
