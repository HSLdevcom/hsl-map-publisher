import React from "react";
import PropTypes from "prop-types";
import QrCode from "components/qrCode";
import { InlineSVG } from "components/util";
import classnames from "classnames";
import get from "lodash/get";
import cheerio from "cheerio";
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

function getQrCodeFromSvg(svg) {
    const $ = cheerio(svg);
}

const slotMargin = 25;
const slotWidth = 392;
const firstSlotLeft = 453;

function createDynamicSlots(template) {
    return get(template, "images", [])
        .reduce((slots, { size = 1, svg = "", name = "" }, idx) => {
            if (!size) {
                return slots;
            }

            const marginToWidth = size > 1 ? size * slotMargin : 0;
            const width = slotWidth * size + marginToWidth;
            const left = firstSlotLeft + (slotWidth * idx) + (slotMargin * idx);

            const qrCode = getQrCodeFromSvg(svg);

            slots.push({
                svg,
                name,
                style: {
                    width,
                    left,
                },
            });
            return slots;
        }, []);
}

const Footer = (props) => {
    const ticketSalesUrl = tagsByShortId[props.shortId.replace(/\s/g, "")];
    const stopInfoUrl = `hsl.fi/pysakit/${props.shortId.replace(/\s/g, "")}`;
    const feedbackUrl = getFeedbackUrl(props.shortId);
    const slots = createDynamicSlots(props.template);

    return (
        <div className={styles.footerWrapper}>
            <InlineSVG className={styles.dottedLine} src={dottedLine}/>
            <InlineSVG className={classnames(styles.footerPiece, styles.hslLogo)} src={hslLogo}/>
            <InlineSVG
                className={classnames(styles.footerPiece, styles.customerService)}
                src={customerService}
            />
            {slots.map((slot, idx) => (
                <div
                    key={`slot_${idx}_${slot.name}`}
                    className={styles.dynamicSlot}
                    style={slot.style}
                    dangerouslySetInnerHTML={{ __html: slot.svg }}
                />
            ))}
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
