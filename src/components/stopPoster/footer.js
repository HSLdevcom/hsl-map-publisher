import React from "react";
import PropTypes from "prop-types";
import QrCode from "components/qrCode";
import { Image } from "components/util";
import feedbackCodes from "data/feedbackCodes.json";

import footerIcon from "icons/footer.svg";

import styles from "./footer.css";

const Footer = (props) => {
    const feedbackCode = feedbackCodes.find(({ shortId }) => shortId === props.shortId);

    if (!feedbackCode || !feedbackCode.code || !feedbackCode.url) {
        console.warn("Could not find feedback code"); // eslint-disable-line no-console
    }

    return (
        <div style={{ position: "relative" }}>
            <Image src={footerIcon}/>
            {feedbackCode && feedbackCode.code &&
            <div className={styles.shortCode}>
                {feedbackCode.code}
            </div>
            }
            {feedbackCode && feedbackCode.url &&
            <div className={styles.qrCode}>
                <QrCode url={feedbackCode.url}/>
            </div>
            }
        </div>
    );
};

Footer.propTypes = {
    shortId: PropTypes.string.isRequired,
};

export default Footer;
