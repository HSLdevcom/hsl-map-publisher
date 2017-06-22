import React from "react";
import PropTypes from "prop-types";
import QrCode from "components/qrCode";
import { Image } from "components/util";

import footerIcon from "icons/footer.svg";
import trunkRouteFooterIcon from "icons/footer_trunk.svg";

import styles from "./footer.css";

const Footer = (props) => {
    const feedbackUrl = `hsl.fi/pysakit/${props.shortId.replace(" ", "")}`;

    return (
        <div style={{ position: "relative" }}>
            <Image src={props.isTrunkStop ? trunkRouteFooterIcon : footerIcon}/>
            <div className={styles.shortCode}>
                {feedbackUrl}
            </div>
            <QrCode url={`http://${feedbackUrl}`} className={styles.qrCode}/>
        </div>
    );
};

Footer.propTypes = {
    shortId: PropTypes.string.isRequired,
    isTrunkStop: PropTypes.bool.isRequired,
};

export default Footer;
