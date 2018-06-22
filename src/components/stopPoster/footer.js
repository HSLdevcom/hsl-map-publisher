import React from "react";
import PropTypes from "prop-types";
import QrCode from "components/qrCode";
import { InlineSVG } from "components/util";
import classnames from "classnames";

import tagsByShortId from "data/tagsByShortId";
import { getFeedbackUrl } from "data/feedbackCodes";

import ticketSalesFooterIcon from "icons/footer_ticketsales.svg";
import ticketSalesFeedbackFooterIcon from "icons/footer_feedback_ticketsales.svg";
import footerIcon from "icons/footer.svg";
import feedbackFooterIcon from "icons/footer_feedback.svg";
import trunkRouteFooterIcon from "icons/footer_trunk.svg";

import dottedLine from "svg/dotted_line.svg";
import hslLogo from "svg/hsl_logo.svg";
import customerService from "svg/customer_service.svg";

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

    console.log(props.template);

    return (
        <div className={styles.footerWrapper}>
            <InlineSVG className={styles.dottedLine} src={dottedLine}/>
            <InlineSVG className={classnames(styles.footerPiece, styles.hslLogo)} src={hslLogo}/>
            <InlineSVG className={classnames(styles.footerPiece, styles.customerService)} src={customerService}/>

            {/*! ticketSalesUrl &&
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
            */}
        </div>
    );
};

Footer.propTypes = {
    template: PropTypes.any,
    shortId: PropTypes.string.isRequired,
    isTrunkStop: PropTypes.bool.isRequired,
};

Footer.defaultProps = {
    template: null,
};

export default Footer;
