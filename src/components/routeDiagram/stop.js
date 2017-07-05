import React from "react";

import { Image } from "components/util";

import { iconsByMode } from "util/domain";

import styles from "./stop.css";

const Icon = props => <Image {...props} className={styles.icon}/>;

const metroRegexp = / ?\(M\)$/;

const getTransferModes = (terminal, nameFi) => {
    const modes = new Set();

    if (metroRegexp.test(nameFi)) { modes.add("SUBWAY"); }

    // Filter out bus terminals, until we have more specs how to handle those.
    if (terminal) {
        terminal.siblings.nodes.map(sibling =>
            sibling.modes.nodes.filter(mode => mode !== "BUS").forEach(mode => modes.add(mode))
        );
    }

    return Array.from(modes);
};

const Stop = props => (
    <div className={styles.stop}>
        <div className={styles.left}/>
        <div className={styles.separator}>
            <div className={styles.separatorTop}/>
            <div className={props.isLast ? styles.separatorLastStop : styles.separatorStop}/>
            <div
                className={styles.separatorBottom}
                style={{ visibility: props.isLast ? "hidden" : "visible" }}
            />
        </div>
        <div className={styles.right}>
            <div>
                <div className={styles.title}>{props.nameFi.replace(metroRegexp, "")}</div>
                <div className={styles.subtitle}>{props.nameSe && props.nameSe.replace(metroRegexp, "")}</div>
            </div>
            <div className={styles.iconContainer}>
                {getTransferModes(props.terminalByTerminalId, props.nameFi).map(mode => (
                    <Icon src={iconsByMode[mode]}/>
                ))}
            </div>
        </div>
    </div>
);

export default Stop;
