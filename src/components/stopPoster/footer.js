import React from "react";
import PropTypes from "prop-types";
import QrCode from "components/qrCode";
import { InlineSVG } from "components/util";

import feedbackCodes from "data/feedbackCodes.json";

import footerIcon from "icons/footer.svg";
import tramFooterIcon from "icons/footer_tram.svg";
import trunkRouteFooterIcon from "icons/footer_trunk.svg";

import styles from "./footer.css";

const Footer = (props) => {
    const stopInfoUrl = `hsl.fi/pysakit/${props.shortId.replace(" ", "")}`;
    const feedbackUrl = `hsl.fi/fixit/${props.shortId.substring(3)}`;
    // Feedback for tram stops
    const hasFeedbackCode = props.shortId.startsWith("H 0") &&
                           feedbackCodes.some(({ code }) => code === props.shortId.substring(3));

    let src;
    if (hasFeedbackCode) {
        src = tramFooterIcon;
    } else {
        src = props.isTrunkStop ? trunkRouteFooterIcon : footerIcon;
    }

    return (
        <div style={{ position: "relative" }}>
            <InlineSVG src={src}/>

            {!hasFeedbackCode &&
                <span>
                    <div className={styles.url}>{stopInfoUrl}</div>
                    <QrCode className={styles.qrCode} url={`http://${stopInfoUrl}`}/>
                </span>
            }

            {hasFeedbackCode &&
                <span>
                    <div className={styles.urlTram}>{stopInfoUrl}</div>
                    <QrCode className={styles.qrCodeTram} url={`http://${stopInfoUrl}`}/>
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
