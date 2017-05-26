import React from "react";
import PropTypes from "prop-types";
import QrCode from "components/qrCode";
import { Image } from "components/util";
import feedbackCodes from "data/feedbackCodes.json";

import footerIcon from "icons/footer.svg";

const Footer = (props) => {
    const feedbackCode = feedbackCodes.find(({ shortId }) => shortId === props.shortId);

    if (!feedbackCode || !feedbackCode.qr) {
        console.warn("Could not find feedback code"); // eslint-disable-line no-console
    }

    return (
        <div style={{ position: "relative" }}>
            {feedbackCode && feedbackCode.qr &&
            <div style={{ position: "absolute", left: 1090, top: 210 }}>
                <QrCode url={feedbackCode.qr}/>
            </div>
            }
            <Image src={footerIcon}/>
        </div>
    );
};

Footer.propTypes = {
    shortId: PropTypes.string.isRequired,
};

export default Footer;
