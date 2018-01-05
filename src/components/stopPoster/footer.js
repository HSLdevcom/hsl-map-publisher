import React from "react";
import PropTypes from "prop-types";
import QrCode from "components/qrCode";
import { InlineSVG } from "components/util";

import tagsByShortId from "data/tagsByShortId";
import { getFeedbackUrl } from "data/feedbackCodes";

import ticketSalesFooterIcon from "icons/footer_ticketsales.svg";
import ticketSalesFeedbackFooterIcon from "icons/footer_feedback_ticketsales.svg";
import footerIcon from "icons/footer.svg";
import feedbackFooterIcon from "icons/footer_feedback.svg";
import trunkRouteFooterIcon from "icons/footer_trunk.svg";

import styles from "./footer.css";

const Footer = (props) => {
    const ticketSalesUrl = tagsByShortId[props.shortId.replace(/\s/g, "")];
    const stopInfoUrl = `hsl.fi/pysakit/${props.shortId.replace(/\s/g, "")}`;
    const feedbackUrl = getFeedbackUrl(props.shortId);

    let src = ticketSalesUrl ? ticketSalesFooterIcon : footerIcon;
    if (props.isTrunkStop) {
        src = trunkRouteFooterIcon;
    }
    if (feedbackUrl) {
        src = ticketSalesUrl ? ticketSalesFeedbackFooterIcon : feedbackFooterIcon;
    }

    return (
        <div style={{ position: "relative" }}>
            <InlineSVG src={src}/>

            {!ticketSalesUrl &&
            <span>
                <div className={styles.urlInfo}>{stopInfoUrl}</div>
                <QrCode className={styles.qrCodeInfo} url={`http://${stopInfoUrl}`}/>
            </span>
            }
            {ticketSalesUrl &&
                <QrCode className={styles.qrCodeTicketSales} url={ticketSalesUrl}/>
            }
            {feedbackUrl &&
                <span>
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
