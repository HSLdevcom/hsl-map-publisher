import React from "react";
import ItemContainer from "components/itemContainer";
import ItemWrapper from "components/itemWrapper";
import { Row } from "components/util";
import { getSymbol } from "util/stops";

import locationIcon from "icons/location.svg";

import styles from "./map.css";

// Max rows in label
const MAX_LABEL_ROWS = 6;

// Map symbol size
const STOP_RADIUS = 17;
const LOCATION_RADIUS = 27;
const LOCATION_RADIUS_MINI = 18;

// Mini map position
const MINI_MAP_MARGIN_RIGHT = 60;
const MINI_MAP_MARGIN_BOTTOM = -40;

// Overlays
const INFO_POSITION_TOP = 1120;
const INFO_POSITION_LEFT = 20;
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

const Location = props => (
    <div style={{ width: props.size, height: props.size }}>
        <img src={locationIcon} role="presentation"/>
    </div>
);

const Stop = props => (
    <div style={{ width: props.size, height: props.size }}>
        <img src={getSymbol(props.stopId)} role="presentation"/>
    </div>
);

const RouteList = (props) => {
    if (props.routes.length > MAX_LABEL_ROWS) {
        const routeIds = props.routes.map(({ routeId }) => routeId).join(", ");
        return <div>{routeIds}</div>;
    }
    return (
        <div>
            {props.routes.map((route, index) => (
                <Row key={index}>
                    {route.routeId} &rarr; {route.destination_fi}
                </Row>
            ))}
        </div>
    );
};

const Label = props => (
    <div className={styles.label} style={{ left: props.x, top: props.y }}>
        <Row>
            <div className={styles.title}>{props.name_fi}</div>
            <div className={styles.subtitle}>({props.shortId})</div>
        </Row>
        <div className={styles.content}>
            <RouteList routes={props.routes}/>
        </div>
    </div>
);

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
                <img src={props.map} role="presentation"/>
            </div>

            <div className={styles.overlays}>
                <ItemContainer>
                    {stops.map((stop, index) => (
                        <ItemWrapper
                            key={index}
                            x={stop.x - STOP_RADIUS}
                            y={stop.y - STOP_RADIUS}
                            angle={45}
                            isFixed
                        >
                            <Stop {...stop} size={STOP_RADIUS * 2}/>
                        </ItemWrapper>
                    ))}

                    <ItemWrapper
                        x={(mapStyle.width / 2) - LOCATION_RADIUS}
                        y={(mapStyle.height / 2) - LOCATION_RADIUS}
                        angle={45}
                        isFixed
                    >
                        <Location size={LOCATION_RADIUS * 2}/>
                    </ItemWrapper>

                    {stops.map((stop, index) => (
                        <ItemWrapper key={index} x={stop.x} y={stop.y} distance={15}>
                            <Label {...stop}/>
                        </ItemWrapper>
                    ))}

                    <ItemWrapper x={INFO_POSITION_LEFT} y={INFO_POSITION_TOP} angle={45} isFixed>
                        <div>
                            <Scalebar pixelsPerMeter={props.pixelsPerMeter}/>
                            <Attribution/>
                        </div>
                    </ItemWrapper>

                    <ItemWrapper
                        x={miniMapStyle.left}
                        y={miniMapStyle.top}
                        angle={45}
                        isFixed
                    >
                        <div style={miniMapStyle}/>
                    </ItemWrapper>
                </ItemContainer>
            </div>

            <div className={styles.miniMap} style={miniMapStyle}>
                <img src={props.miniMap} role="presentation"/>
                <div className={styles.center} style={{ margin: -LOCATION_RADIUS_MINI }}>
                    <Location size={LOCATION_RADIUS_MINI * 2}/>
                </div>
            </div>
        </div>
    );
};

export default Map;
