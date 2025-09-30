import React from 'react';
import omit from 'lodash/omit';
import PropTypes from 'prop-types';

export default class InlineSVG extends React.Component {
  constructor(props) {
    super(props);
    this.iframeRef = React.createRef();
  }

  componentDidMount() {
    this.resizeIframeToFitSvg();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.src !== this.props.src) {
      this.resizeIframeToFitSvg();
    }
  }

  resizeIframeToFitSvg() {
    if (!this.props.fitToSize) return;
    const iframe = this.iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`<html><body style="margin:0;">${this.props.src}</body></html>`);
      doc.close();

      const svg = doc.querySelector('svg');
      if (svg) {
        const width =
          svg.getAttribute('width') ||
          (svg.viewBox?.baseVal?.width ? svg.viewBox.baseVal.width : null);
        const height =
          svg.getAttribute('height') ||
          (svg.viewBox?.baseVal?.height ? svg.viewBox.baseVal.height : null);

        if (width && height) {
          iframe.style.width = `${width}px`;
          iframe.style.height = `${height}px`;
        }
      }
    }
  }

  render() {
    return (
      <div {...omit(this.props, 'src')}>
        <iframe
          srcDoc={`<html><body>${this.props.src}</body></html>`}
          title="SVG"
          ref={this.iframeRef}
          style={{ border: 'none', height: '100%', width: '100%' }}
        />
      </div>
    );
  }
}

InlineSVG.propTypes = {
  src: PropTypes.string.isRequired,
  fitToSize: PropTypes.bool,
};

InlineSVG.defaultProps = {
  fitToSize: false,
};
