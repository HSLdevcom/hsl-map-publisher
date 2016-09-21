import React from "react";
import { Image } from "components/util";

import infoIcon from "icons/info.svg";

import styles from "./info.css";

const Info = () => (
    <div className={styles.root}>
        <Image src={infoIcon}/>
    </div>
);

export default Info;

