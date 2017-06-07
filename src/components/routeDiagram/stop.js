import React from "react";

import { Image } from "components/util";

import { iconsByMode } from "util/domain";

import styles from "./stop.css";

const Icon = props => (
    <Image {...props} className={styles.icon}/>
);

const Stop = props => (
    <div className={styles.stop}>
        <div className={styles.left}/>
        <div className={styles.separator}>
            <div className={styles.separatorTop}/>
            <div className={props.isLast ? styles.separatorLastStop : styles.separatorStop}/>
            {!props.isLast && <div className={styles.separatorBottom}/>}
        </div>
        <div className={styles.right}>
            <div>
                <div className={styles.title}>{props.nameFi}</div>
                <div className={styles.subtitle}>{props.nameSe}</div>
            </div>
            {props.terminalByTerminalId && (
                <div className={styles.iconContainer}>
                    {props.terminalByTerminalId.siblings.nodes.map(sibling => (
                      sibling.modes.nodes
                          // Filter out bus terminals, until we have more specs how to handle those.
                          .filter(mode => mode !== "BUS")
                          .map(mode => <Icon src={iconsByMode[mode]}/>)
                    ))}
                </div>
            )}
        </div>
    </div>
);

export default Stop;
