import React from "react";

import locationIcon from "icons/location.svg";
import busStopIcon from "icons/stopBus.svg";
// TODO: Use tram icon for tram stops
import tramStopIcon from "icons/stopTram.svg"; // eslint-disable-line

import styles from "./map.css";

const Stop = props => (
    <div className={styles.stop} style={{ left: props.x, top: props.y }}>
        <img src={busStopIcon} role="presentation"/>
    </div>
);

const Location = () => (
    <div className={styles.location}>
        <img src={locationIcon} role="presentation"/>
    </div>
);

const Map = (props) => {
    const mapStyle = { width: props.mapOptions.width, height: props.mapOptions.height };
    const miniMapStyle = { width: props.miniMapOptions.width, height: props.miniMapOptions.height };

    return (
        <div className={styles.root} style={mapStyle}>
            <div className={styles.container}>
                <img src={props.map} role="presentation"/>
                {props.stops.map((stop, index) => <Stop key={index} {...stop}/>)}
                <Location/>
            </div>
            <div className={styles.miniMap} style={miniMapStyle}>
                <div className={styles.container}>
                    <img src={props.miniMap} role="presentation"/>
                    <Location/>
                </div>
            </div>
        </div>
    );
};

export default Map;
