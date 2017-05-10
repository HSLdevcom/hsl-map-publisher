import React from "react";
import PropTypes from "prop-types";
import ItemContainer from "components/itemContainer";
import ItemFixed from "components/itemFixed";
import ItemPositioned from "components/itemPositioned";
import { Row } from "components/util";
import { getSymbol } from "util/stops";
import CustomTypes from "util/customTypes";

import locationIcon from "icons/marker.svg";

import MapImageContainer from "./mapImageContainer";

import styles from "./map.css";

// Max rows in label
const MAX_LABEL_ROWS = 6;
const MAX_LABEL_CHARS = 36;

// Map symbol size
const STOP_RADIUS = 15;
const LOCATION_RADIUS = 22;
const LOCATION_RADIUS_MINI = 5;

// Mini map position
const MINI_MAP_MARGIN_RIGHT = 60;
const MINI_MAP_MARGIN_BOTTOM = -40;

// Overlays
const INFO_MARGIN_BOTTOM = 78;
const INFO_MARGIN_LEFT = 20;
const SCALEBAR_TARGET_WIDTH = 250;

const Attribution = () => (
    <div className={styles.attribution}>
        &copy; OpenStreetMap
    </div>
);

const Scalebar = (props) => {
    const meters = Math.ceil((SCALEBAR_TARGET_WIDTH / props.pixelsPerMeter) / 100) * 100;
    return (
        <div className={styles.scalebar}>
            <div>{meters} m</div>
            <div style={{ width: props.pixelsPerMeter * meters }}/>
        </div>
    );
};

Scalebar.propTypes = {
    pixelsPerMeter: PropTypes.number.isRequired,
};

const LocationSymbol = props => (
    <div style={{ width: props.size, height: props.size }}>
        <img src={locationIcon} style={{ width: "100%" }}/>
    </div>
);

LocationSymbol.propTypes = {
    size: PropTypes.number.isRequired,
};

const StopSymbol = props => (
    <div style={{ width: props.size, height: props.size }}>
        <img src={getSymbol({ stopIds: props.stopIds, routeIds: props.routeIds })}/>
    </div>
);

StopSymbol.propTypes = {
    size: PropTypes.number.isRequired,
    stopIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    routeIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
};

const RouteList = (props) => {
    if (props.routes.length > MAX_LABEL_ROWS) {
        let rowLength = 0;
        const components = props.routes.map(({ routeId }, index, routes) => {
            const content = `${routeId}${(index < routes.length - 1) ? ", " : ""}`;
            const isNewLine = rowLength + content.length > MAX_LABEL_CHARS;
            rowLength = isNewLine ? content.length : rowLength + content.length;
            return <span className={styles.route} key={index}>{isNewLine && <br/>}{content}</span>;
        });
        return <div>{components}</div>;
    }
    return (
        <div>
            {props.routes.map((route, index) => (
                <Row key={index}>
                    <span className={styles.route} style={{ width: "2em" }}>{route.routeId}</span>
                    {"\xa0"}
                    {route.destinationFi}
                    {"\xa0"}
                    <span style={{ fontWeight: 300 }}>{route.destinationSe}</span>
                </Row>
            ))}
        </div>
    );
};

RouteList.propTypes = {
    routes: PropTypes.arrayOf(PropTypes.shape({
        routeId: PropTypes.string.isRequired,
        destinationFi: PropTypes.string.isRequired,
        destinationSe: PropTypes.string.isRequired,
    })).isRequired,
};

const Label = props => (
    <div className={styles.label}>
        <div className={styles.title}>{props.nameFi}</div>
        <div className={styles.subtitle}>{props.nameSe}</div>
        <div className={styles.content}>
            <RouteList routes={props.routes}/>
        </div>
    </div>
);

Label.propTypes = {
    routes: RouteList.propTypes.routes,
    nameFi: PropTypes.string.isRequired,
    nameSe: PropTypes.string.isRequired,
};

const Map = (props) => {
    const mapStyle = {
        width: props.mapOptions.width,
        height: props.mapOptions.height,
    };
    const miniMapStyle = {
        left: mapStyle.width - MINI_MAP_MARGIN_RIGHT - props.miniMapOptions.width,
        top: mapStyle.height - MINI_MAP_MARGIN_BOTTOM - props.miniMapOptions.height,
        width: props.miniMapOptions.width,
        height: props.miniMapOptions.height,
    };

    // Filter out stops that are behind the mini map
    const stops = props.stops.filter(
        stop => stop.x < miniMapStyle.left || stop.y < miniMapStyle.top
    );

    return (
        <div className={styles.root} style={mapStyle}>
            <div className={styles.map}>
                <MapImageContainer
                    options={props.mapOptions}
                    components={{
                        routes: { enabled: true },
                        citybikes: { enabled: true },
                        print: { enabled: true },
                    }}
                    date={props.date}
                />
            </div>

            <div className={styles.overlays}>
                <ItemContainer>
                    {stops.map((stop, index) => (
                        <ItemFixed
                            key={index}
                            top={stop.y - STOP_RADIUS}
                            left={stop.x - STOP_RADIUS}
                        >
                            <StopSymbol
                                stopIds={stop.stopIds}
                                routeIds={stop.routes.map(({ routeId }) => routeId)}
                                size={STOP_RADIUS * 2}
                            />
                        </ItemFixed>
                    ))}

                    <ItemFixed
                        top={(mapStyle.height / 2) - LOCATION_RADIUS}
                        left={(mapStyle.width / 2) - LOCATION_RADIUS}
                    >
                        <LocationSymbol size={LOCATION_RADIUS * 2}/>
                    </ItemFixed>

                    {stops.map((stop, index) => (
                        <ItemPositioned
                            key={index}
                            x={stop.x}
                            y={stop.y}
                            distance={25}
                            angle={stop.calculatedHeading}
                        >
                            <Label {...stop}/>
                        </ItemPositioned>
                    ))}

                    <ItemFixed top={mapStyle.height - INFO_MARGIN_BOTTOM} left={INFO_MARGIN_LEFT}>
                        <div>
                            <Scalebar pixelsPerMeter={props.pixelsPerMeter}/>
                            <Attribution/>
                        </div>
                    </ItemFixed>

                    <ItemFixed top={miniMapStyle.top} left={miniMapStyle.left}>
                        <div style={miniMapStyle}/>
                    </ItemFixed>
                </ItemContainer>
            </div>

            <div className={styles.miniMap} style={miniMapStyle}>
                <MapImageContainer
                    options={props.miniMapOptions}
                    components={{ text: { enabled: true }, print: { enabled: true } }}
                />
                <div className={styles.center} style={{ margin: -LOCATION_RADIUS_MINI }}>
                    <LocationSymbol size={LOCATION_RADIUS_MINI * 2}/>
                </div>
            </div>
        </div>
    );
};

Map.propTypes = {
    mapOptions: PropTypes.shape(CustomTypes.mapOptions).isRequired,
    miniMapOptions: PropTypes.shape(CustomTypes.mapOptions).isRequired,
    stops: PropTypes.arrayOf(PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        routes: PropTypes.arrayOf(PropTypes.shape({
            routeId: PropTypes.string.isRequired,
        }).isRequired).isRequired,
        stopIds: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
        calculatedHeading: PropTypes.number.isRequired,
    })).isRequired,
    pixelsPerMeter: PropTypes.number.isRequired,
    date: PropTypes.string.isRequired,
};

export default Map;
