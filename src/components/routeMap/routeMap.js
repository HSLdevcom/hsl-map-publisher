import React, { Component } from "react";
import PropTypes from "prop-types";
import { lngLatToMeters } from "global-mercator";
import moment from "moment";
import { JustifiedRow } from "components/util";
import renderQueue from "util/renderQueue";

import CropMarks from "components/cropMarks";

import legendIcon from "./legend.svg";
import footerLeftIcon from "./footerLeft.svg";
import footerRightIcon from "./footerRight.svg";

import styles from "./routeMap.css";

/*
Use ImageMagick to create tilesets:
convert 35000.png -crop 1024x1024 \
    -set filename:tile "%[fx:page.x/1024+1]_%[fx:page.y/1024+1]" \
    +repage +adjoin "35000/%[filename:tile].png"
*/
const tileset = {
    top: 8506226.10604208,
    left: 2712353.539647764,
    metersPerPixel: 3.36263561649125,
    url: "http://localhost:8080/35000/{x}_{y}.png",
    tileSize: 1024,
    rows: 28,
    columns: 28,
    dpi: 300,
};

const Tile = (props) => {
    const style = {
        position: "absolute",
        left: (((props.x - 1) * tileset.tileSize) - props.offsetX) * props.scale,
        top: (((props.y - 1) * tileset.tileSize) - props.offsetY) * props.scale,
        width: tileset.tileSize * props.scale,
        height: tileset.tileSize * props.scale,
    };
    const url = tileset.url.replace("{x}", props.x).replace("{y}", props.y);
    return (
        <img
            src={url}
            style={style}
            onLoad={() => props.onLoad()}
            onError={() => props.onError(new Error(`Failed to load ${url}`))}
        />
    );
};

Tile.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    offsetX: PropTypes.number.isRequired,
    offsetY: PropTypes.number.isRequired,
    scale: PropTypes.number.isRequired,
    onLoad: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
};

class RouteMap extends Component {
    componentDidMount() {
        this.updateQueue();
    }

    componentDidUpdate() {
        this.updateQueue();
    }

    updateQueue() {
        const promises = this.promises;
        renderQueue.add(promises);
        Promise.all(promises)
            .then(() => renderQueue.remove(promises))
            .catch(error => renderQueue.remove(promises, { error }));
    }

    render() {
        // Calculate width and height in pixels
        const width = Math.round((this.props.width / 25.4) * 72);
        const height = Math.round((this.props.height / 25.4) * 72);

        const [left, top] = lngLatToMeters([this.props.lon, this.props.lat]);
        const offsetX = Math.round((left - tileset.left) / tileset.metersPerPixel);
        const offsetY = Math.round((tileset.top - top) / tileset.metersPerPixel);

        const scale = 72 / tileset.dpi;
        const tileCountX = Math.ceil((width / tileset.tileSize) / scale);
        const tileCountY = Math.ceil((height / tileset.tileSize) / scale);
        const leftmostTile = Math.floor(Math.max(offsetX / tileset.tileSize, 0));
        const topmostTile = Math.floor(Math.max(offsetY / tileset.tileSize, 0));

        const tiles = [];
        this.promises = [];
        for (let y = topmostTile + 1; y <= topmostTile + tileCountY; y++) {
            for (let x = leftmostTile + 1; x <= leftmostTile + tileCountX; x++) {
                if (x > tileset.rows || y > tileset.columns) break;
                const props = { x, y, offsetX, offsetY, scale, key: `${x}${y}` };
                const promise = new Promise((resolve, reject) => {
                    tiles.push(<Tile {...props} onLoad={resolve} onError={reject}/>);
                });
                this.promises.push(promise);
            }
        }

        // Add 15px (5 mm) bleed on each side
        const style = {
            width: width + 30,
            height: height + 30,
            padding: 34 + 30,
            margin: -15,
        };

        return (
            <CropMarks>
                <div className={styles.root} style={style}>
                    <JustifiedRow>
                        <div className={styles.title}>{this.props.title}</div>
                        <div className={styles.title}>{moment().format("D.M.YYYY")}</div>
                    </JustifiedRow>
                    <JustifiedRow>
                        <div className={styles.subtitle}>{this.props.subtitle}</div>
                    </JustifiedRow>
                    <div className={styles.content}>
                        {tiles}
                        <div className={styles.legend}>
                            <img src={legendIcon}/>
                        </div>
                    </div>
                    <JustifiedRow>
                        <div><img src={footerLeftIcon}/></div>
                        <div><img src={footerRightIcon}/></div>
                    </JustifiedRow>
                </div>
            </CropMarks>
        );
    }
}

RouteMap.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
    lat: PropTypes.number.isRequired,
};

export default RouteMap;
