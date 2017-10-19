import React, { Component } from "react";
import PropTypes from "prop-types";
import { InlineSVG } from "components/util";
import renderQueue from "util/renderQueue";

import { getFeedbackUrl } from "data/feedbackCodes";

import mobileIcon from "icons/mobile_ad.svg";
import mobileTrunkIcon from "icons/mobile_ad_trunk.svg";
import feedbackIcon from "icons/feedback_ad.svg";


class AdContainer extends Component {
    constructor(props) {
        super(props);

        const ads = [];
        if (!this.props.isTrunkStop) ads.push(mobileIcon);
        if (this.props.isTrunkStop) ads.push(mobileTrunkIcon);
        if (getFeedbackUrl(this.props.shortId)) ads.push(feedbackIcon);

        this.state = { ads };
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
            this.setState({ ads: this.state.ads.slice(0, -1) });
            return;
        }
        renderQueue.remove(this);
    }

    hasOverflow() {
        return (this.root.scrollWidth > this.root.clientWidth) ||
               (this.root.scrollHeight > this.root.clientHeight);
    }

    render() {
        const style = {
            width: this.props.width,
            height: this.props.height,
            overflow: "hidden",
        };
        return (
            <div style={style} ref={(ref) => { this.root = ref; }}>
                {this.state.ads.map((src, i) => <InlineSVG key={i} src={src}/>)}
            </div>
        );
    }
}

AdContainer.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    shortId: PropTypes.string.isRequired,
    isTrunkStop: PropTypes.bool.isRequired,
};

export default AdContainer;
