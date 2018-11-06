import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { InlineSVG } from 'components/util';
import renderQueue from 'util/renderQueue';
import styles from './stopPoster.css';

class AdContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      spaces: 3,
    };
  }

  componentDidMount() {
    renderQueue.add(this);
    this.updateLayout();
  }

  componentDidUpdate() {
    this.updateLayout();
  }

  updateLayout() {
    if (this.hasOverflow()) {
      this.setState(state => ({ spaces: state.spaces - 1 }));
    } else {
      renderQueue.remove(this);
    }
  }

  hasOverflow() {
    return (
      this.root.scrollWidth > this.root.clientWidth ||
      this.root.scrollHeight > this.root.clientHeight
    );
  }

  render() {
    const iconStyle = {
      marginTop: 52,
      marginLeft: 55,
      marginRight: 48,
    };

    const ads = get(this.props, 'template.slots', [])
      .map(slot => get(slot, 'image.svg', '')) // get svg's from template
      .filter(svg => !!svg); // Only non-falsy svg's allowed

    return (
      <div
        className={styles.adsContainer}
        ref={ref => {
          this.root = ref;
        }}>
        {ads.slice(0, this.state.spaces).map((src, i) => (
          <InlineSVG key={i} style={iconStyle} src={src} />
        ))}
      </div>
    );
  }
}

AdContainer.propTypes = {
  shortId: PropTypes.string.isRequired,
  template: PropTypes.any.isRequired,
};

export default AdContainer;
