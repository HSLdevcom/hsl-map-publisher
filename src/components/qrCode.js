import React, { Component } from "react";
import PropTypes from "prop-types";
import QRCodeLib from "qrcode";
import renderQueue from "util/renderQueue";

class QrCode extends Component {
    componentDidMount() {
        this.updateCode();
    }

    componentDidUpdate() {
        this.updateCode();
    }

    updateCode() {
        renderQueue.add(this);
        QRCodeLib.toCanvas(this.canvas, this.props.url, function (error) {
            if (error) {
                console.error(error); // eslint-disable-line no-console
            }
            renderQueue.remove(this, { success: !error });
        });
    }

    render() {
        return (
            <canvas ref={(ref) => { this.canvas = ref; }}/>
        );
    }
}

QrCode.propTypes = {
    url: PropTypes.string.isRequired
};

export default QrCode;
