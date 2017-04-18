import React from "react";

import Destinations from "./destinations";
import Stop from "./stop";
import Gap from "./gap";

import styles from "./path.css";

// Must match width and radius values in CSS
const PATH_WIDTH = 246;
const LINE_RADIUS = 20;

function getWidth(nodes, isRoot = true) {
    let width = 0;
    nodes.forEach((node, index) => {
        if (!node.children || (isRoot && index === nodes.length - 1)) {
            width += PATH_WIDTH;
        } else {
            width += getWidth(node.children, false);
        }
    });
    return isRoot ? (width - PATH_WIDTH - LINE_RADIUS) : width;
}

const Path = props => (
    <div className={styles.root}>
        <div className={styles.header}/>
        {props.items && props.items.map((item, index) => (
            <div key={index}>
                {item.type === "stop" &&
                <Stop {...item} isLast={!props.children && index === props.items.length - 1}/>
                }
                {item.type === "gap" && <Gap/>}
                {item.destinations && <Destinations destinations={item.destinations}/>}
            </div>
        ))}

        {props.children &&
            <div>
                <div className={styles.footer} style={{ width: getWidth(props.children) }}/>
                <div className={styles.children}>
                    {props.children.map((branch, index) => <Path key={index} {...branch}/>)}
                </div>
            </div>
        }
    </div>
);

export default Path;