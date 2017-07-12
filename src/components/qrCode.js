import React, { Component } from "react";
import PropTypes from "prop-types";
import QRCodeLib from "qrcode";
import renderQueue from "util/renderQueue";


// This enables us to set a global scale from app.js
let scale = 1;

export function setQrCodeScale(newScale) {
    scale = newScale;
}

class QrCode extends Component {
    componentDidMount() {
        this.updateCode();
    }

    componentDidUpdate() {
        this.updateCode();
    }

    updateCode() {
        renderQueue.add(this);
        QRCodeLib.toCanvas(this.canvas, this.props.url, {
            scale: 5 * scale,
            margin: 2,
        }, (error) => {
            if (error) {
                console.error(error); // eslint-disable-line no-console
            }
            renderQueue.remove(this, { error });
        });
    }

    render() {
        return (
            <canvas
                ref={(ref) => { this.canvas = ref; }}
                style={{ transform: `scale(${1 / scale})` }}
                className={this.props.className}
            />
        );
    }
}

QrCode.propTypes = {
    className: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
};

export default QrCode;
