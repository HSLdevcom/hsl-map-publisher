import React, { Component } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import InlineSVG from 'components/inlineSVG';
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

  componentWillUnmount() {
    // This component may mount and unmount multiple times, so make sure that it
    // doesn't stop the poster from finishing rendering by holding up the queue.
    renderQueue.remove(this);
  }

  updateLayout() {
    const hasOverflow = this.hasOverflow();
    const { spaces } = this.state;

    if (hasOverflow && spaces > 0) {
      const nextSpaces = spaces - 1;
      this.setState({ spaces: nextSpaces });
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
