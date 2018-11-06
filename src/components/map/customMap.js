import React, { Component } from "react";
import PropTypes from "prop-types";
import get from "lodash/get";
import cheerio from "cheerio";
import Measure from "react-measure";
import StopMap from "./stopMapContainer";
import { InlineSVG } from "../util";
import renderQueue from "../../util/renderQueue";

const MIN_MAP_HEIGHT = 500;
const parseAttr = attr => Math.round(parseInt(attr, 10));

class CustomMap extends Component {
    static propTypes = {
        stopId: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        // eslint-disable-next-line react/require-default-props
        isSummerTimetable: PropTypes.bool,
        // eslint-disable-next-line react/require-default-props
        template: PropTypes.any,
        setMapHeight: PropTypes.func.isRequired,
        shouldRenderMap: PropTypes.bool.isRequired,
    }

    state = {
        mapImage: "",
        mapWidth: -1,
        mapHeight: -1,
    };

    componentDidMount() {
        renderQueue.add(this);
        this.updateTemplateImage();
    }

    componentDidUpdate() {
        this.updateTemplateImage();
    }

    // Used only if a static image replaces the local map.
    onResize = ({ client: { width, height } }) => {
        const { mapWidth, mapHeight } = this.state;
        const { setMapHeight } = this.props;

        setMapHeight(height);

        // Only measure once
        if (mapWidth > -1 || mapHeight > -1) {
            return;
        }

        this.setState({
            mapWidth: width,
            mapHeight: height,
        });
    }

    updateTemplateImage() {
        const { mapImage } = this.state;
        const newMapImage = get(this.props, "template.slots[0].image.svg", "");

        if (mapImage !== newMapImage) {
            this.setState({
                mapImage: newMapImage,
            });
        }

        renderQueue.remove(this);
    }

    render() {
        const {
            stopId,
            date,
            isSummerTimetable,
            shouldRenderMap,
        } = this.props;

        const { mapImage, mapWidth, mapHeight } = this.state;

        let aspectRatio = 0;
        let svgHeight = 0;
        let mapImageStyle = {};
        let renderMap = shouldRenderMap && mapHeight >= MIN_MAP_HEIGHT ? "generated" : "none";

        if (mapImage) {
            let mapImageWidth = 0;
            let mapImageHeight = 0;
            const $svg = cheerio.load(mapImage);

            if ($svg("svg").attr("width")) {
                mapImageWidth = parseAttr($svg("svg").attr("width"));
                mapImageHeight = parseAttr($svg("svg").attr("height"));
            } else {
                const svgViewBox = $svg("svg")
                    .attr("viewBox")
                    .split(" ");
                mapImageWidth = parseAttr(svgViewBox[2]);
                mapImageHeight = parseAttr(svgViewBox[3]);
            }

            aspectRatio = mapImageHeight / mapImageWidth;
            svgHeight = Math.floor(mapWidth * aspectRatio);

            if (svgHeight && svgHeight <= mapHeight) {
                renderMap = "svg";

                mapImageStyle = {
                    width: mapWidth,
                    height: svgHeight,
                };
            }
        }

        // Aspect ratio height of SVG if one is set, auto otherwise.
        const wrapperHeight = svgHeight !== 0 ? svgHeight : mapHeight;

        return (
            <Measure client onResize={this.onResize}>
                {({ measureRef }) => (
                    <div
                        style={{
                            flex: !svgHeight ? 1 : "none",
                            width: "100%",
                            height: wrapperHeight,
                        }}
                        ref={measureRef}
                    >
                        { renderMap === "svg" ? (
                            <InlineSVG style={mapImageStyle} src={mapImage}/>
                        ) : renderMap === "generated" ? (
                            <StopMap
                                stopId={stopId}
                                date={date}
                                width={mapWidth}
                                height={mapHeight}
                                showCitybikes={isSummerTimetable}
                            />
                        ) : null }
                    </div>
                )}
            </Measure>
        );
    }
}

export default CustomMap;
