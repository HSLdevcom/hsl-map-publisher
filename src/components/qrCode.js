import React, { Component } from 'react';
import PropTypes from 'prop-types';
import QRCodeLib from 'qrcode';
import renderQueue from 'util/renderQueue';

class QrCode extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.updateCode(this.props.url);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.url !== this.props.url) {
      this.updateCode(nextProps.url);
    }
  }

  componentWillUnmount() {
    renderQueue.remove(this);
  }

  updateCode(url) {
    renderQueue.add(this);
    QRCodeLib.toString(url, { margin: 2 }, (error, src) => {
      if (error) {
        renderQueue.remove(this, { error });
        return;
      }
      this.setState({ src: `data:image/svg+xml;base64,${btoa(src)}` });
    });
  }

  render() {
    return (
      <div style={this.props.style} className={this.props.className}>
        {this.state.src && (
          <img
            style={{ display: 'block', width: '100%' }}
            src={this.state.src}
            onLoad={() => renderQueue.remove(this)}
            onError={() =>
              renderQueue.remove(this, {
                error: new Error('Failed to render QR code'),
              })
            }
            alt=""
          />
        )}
      </div>
    );
  }
}

QrCode.defaultProps = {
  style: null,
  className: null,
};

QrCode.propTypes = {
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  className: PropTypes.string,
  url: PropTypes.string.isRequired,
};

export default QrCode;
