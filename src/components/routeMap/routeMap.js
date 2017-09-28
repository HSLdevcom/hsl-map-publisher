import React, { Component } from "react";
import PropTypes from "prop-types";
import { lngLatToMeters } from "global-mercator";
import moment from "moment";
import { JustifiedRow, InlineSVG } from "components/util";
import renderQueue from "util/renderQueue";

import CropMarks from "components/cropMarks";

import legendIcon from "./legend.svg";
import footerLeftIcon from "./footerLeft.svg";
import footerRightIcon from "./footerRight.svg";

import styles from "./routeMap.css";

const Tile = (props) => {
    const style = {
        position: "absolute",
        left: (((props.x - 1) * props.tileSize) - props.offsetX) * props.scale,
        top: (((props.y - 1) * props.tileSize) - props.offsetY) * props.scale,
        width: props.tileSize * props.scale,
        height: props.tileSize * props.scale,
    };
    const url = props.url.replace("{x}", props.x).replace("{y}", props.y);
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
    url: PropTypes.string.isRequired,
    tileSize: PropTypes.number.isRequired,
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
        const tileset = this.props.tileset;

        // Calculate width and height in pixels
        const width = Math.round((this.props.width / 25.4) * 72);
        const height = Math.round((this.props.height / 25.4) * 72);

        const [left, top] = lngLatToMeters([this.props.lon, this.props.lat]);
        const offsetX = Math.round((left - tileset.left) / tileset.metersPerPixel);
        const offsetY = Math.round((tileset.top - top) / tileset.metersPerPixel);

        const scale = 72 / tileset.dpi;
        const tileCountX = Math.ceil((width / tileset.tileSize) / scale);
        const tileCountY = Math.ceil((height / tileset.tileSize) / scale);
        const leftmostTile = Math.max(Math.floor(offsetX / tileset.tileSize), 1);
        const topmostTile = Math.max(Math.floor(offsetY / tileset.tileSize), 1);

        const tiles = [];
        this.promises = [];
        for (let y = topmostTile; y <= topmostTile + tileCountY; y++) {
            for (let x = leftmostTile; x <= leftmostTile + tileCountX; x++) {
                if (x > tileset.rows || y > tileset.columns) break;
                const props = { ...tileset, x, y, offsetX, offsetY, scale, key: `${x}${y}` };
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
                            <InlineSVG src={legendIcon}/>
                        </div>
                    </div>
                    <JustifiedRow>
                        <div className={styles.left}>
                            <InlineSVG src={footerLeftIcon}/>
                        </div>
                        <div className={styles.right}>
                            <InlineSVG src={footerRightIcon}/>
                        </div>
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
    tileset: PropTypes.shape({
        top: PropTypes.number.isRequired,
        left: PropTypes.number.isRequired,
        metersPerPixel: PropTypes.number.isRequired,
        url: PropTypes.string.isRequired,
        tileSize: PropTypes.number.isRequired,
        rows: PropTypes.number.isRequired,
        columns: PropTypes.number.isRequired,
        dpi: PropTypes.number.isRequired,
    }).isRequired,
};

export default RouteMap;
