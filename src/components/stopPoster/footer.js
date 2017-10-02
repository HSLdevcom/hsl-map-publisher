import React from "react";
import PropTypes from "prop-types";
import QrCode from "components/qrCode";
import { InlineSVG } from "components/util";

import { getFeedbackUrl } from "data/feedbackCodes";

import footerIcon from "icons/footer.svg";
import feedbackFooterIcon from "icons/footer_feedback.svg";
import trunkRouteFooterIcon from "icons/footer_trunk.svg";

import styles from "./footer.css";

const Footer = (props) => {
    const stopInfoUrl = `hsl.fi/pysakit/${props.shortId.replace(" ", "")}`;
    const feedbackUrl = getFeedbackUrl(props.shortId);

    let src = footerIcon;
    if (props.isTrunkStop) {
        src = trunkRouteFooterIcon;
    }
    if (feedbackUrl) {
        src = feedbackFooterIcon;
    }

    return (
        <div style={{ position: "relative" }}>
            <InlineSVG src={src}/>

            {!feedbackUrl &&
                <span>
                    <div className={styles.url}>{stopInfoUrl}</div>
                    <QrCode className={styles.qrCode} url={`http://${stopInfoUrl}`}/>
                </span>
            }

            {feedbackUrl &&
                <span>
                    <div className={styles.urlInfo}>{stopInfoUrl}</div>
                    <QrCode className={styles.qrCodeInfo} url={`http://${stopInfoUrl}`}/>
                    <div className={styles.urlFeedback}>{feedbackUrl}</div>
                    <QrCode className={styles.qrCodeFeedback} url={`http://${feedbackUrl}`}/>
                </span>
            }
        </div>
    );
};

Footer.propTypes = {
    shortId: PropTypes.string.isRequired,
    isTrunkStop: PropTypes.bool.isRequired,
};

export default Footer;
