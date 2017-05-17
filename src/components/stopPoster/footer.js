import React from "react";
import QrCode from "components/qrCode";
import { Image } from "components/util";

import footerIcon from "icons/footer.svg";

const Footer = () => (
    <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 1093, top: 237 }}>
            <QrCode url="http://www.hsl.fi/"/>
        </div>
        <Image src={footerIcon}/>
    </div>
);

export default Footer;
