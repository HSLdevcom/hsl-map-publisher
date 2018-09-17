import React, { Component } from "react";
import PropTypes from "prop-types";
import get from "lodash/get";
import cheerio from "cheerio";
import StopMap from "./stopMapContainer";
import { InlineSVG } from "../util";

const MAP_MIN_HEIGHT = 500;
const parseAttr = attr => Math.round(parseInt(attr, 10));

class CustomMap extends Component {
    static propTypes = {
        stopId: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        // eslint-disable-next-line react/require-default-props
        isSummerTimetable: PropTypes.bool,
        // eslint-disable-next-line react/require-default-props
        template: PropTypes.any,
        shouldRenderFixedContent: PropTypes.bool.isRequired,
    }

    constructor(props) {
        super();
        this.map = React.createRef();

        const mapImage = get(props, "template.slots[0].image.svg", "");

        this.state = {
            mapImage,
        };
    }

    componentDidUpdate() {
        this.updateTemplateImage();
    }

    updateTemplateImage() {
        const { mapImage } = this.state;
        const newMapImage = get(this.props, "template.slots[0].image.svg", "");

        if (mapImage !== newMapImage) {
            this.setState({
                mapImage: newMapImage,
            });
        }
    }

    render() {
        const {
            stopId,
            date,
            isSummerTimetable,
            shouldRenderFixedContent,
        } = this.props;

        const { mapImage } = this.state;

        let mapImageWidth = 0;
        let mapImageHeight = 0;
        let aspectRatio = 0;

        if (mapImage) {
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
        }

        const { clientWidth = 0, clientHeight = 0 } = (this.map.current || {});

        const mapImageStyle = {
            width: clientWidth,
            height: clientWidth * aspectRatio,
        };

        const wrapperHeight = aspectRatio > 0 ? clientWidth * aspectRatio : "auto";

        return (
            <div style={{ flex: wrapperHeight === "auto" ? 1 : "none", height: wrapperHeight }} ref={this.map}>
                { mapImage ? (
                    <InlineSVG style={mapImageStyle} src={mapImage}/>
                ) : (shouldRenderFixedContent && clientHeight >= MAP_MIN_HEIGHT)
                  && (
                      <StopMap
                          stopId={stopId}
                          date={date}
                          width={clientWidth}
                          height={clientHeight}
                          showCitybikes={isSummerTimetable}
                      />
                  )
                }
            </div>
        );
    }
}

export default CustomMap;
