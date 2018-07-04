import React, { Component } from "react";
import PropTypes from "prop-types";
import get from "lodash/get";
import { InlineSVG } from "components/util";
import renderQueue from "util/renderQueue";

import { getFeedbackUrl } from "data/feedbackCodes";

import mobileIcon from "icons/ad_mobile.svg";
import mobileTrunkIcon from "icons/ad_mobile_trunk.svg";
import feedbackIcon from "icons/ad_feedback.svg";
import noSmokingIcon from "icons/ad_nosmoking.svg";

class AdContainer extends Component {
    constructor(props) {
        super(props);

        const ads = get(props, "template.slots", [])
            .map(slot => get(slot, "image.svg", "")) // get svg's from template
            .filter(svg => !!svg); // Only non-falsy svg's allowed

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
            this.setState(state => ({ ads: state.ads.slice(0, -1) }));
        } else {
            renderQueue.remove(this);
        }
    }

    hasOverflow() {
        return (this.root.scrollWidth > this.root.clientWidth)
               || (this.root.scrollHeight > this.root.clientHeight);
    }

    render() {
        const style = {
            width: this.props.width,
            height: this.props.height,
            overflow: "hidden",
        };
        const iconStyle = {
            marginTop: 52,
            marginLeft: 55,
            marginRight: 48,
        };
        return (
            <div style={style} ref={(ref) => { this.root = ref; }}>
                {this.state.ads.map((src, i) => <InlineSVG key={i} style={iconStyle} src={src}/>)}
            </div>
        );
    }
}

AdContainer.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    shortId: PropTypes.string.isRequired,
    template: PropTypes.any.isRequired,
};

export default AdContainer;
