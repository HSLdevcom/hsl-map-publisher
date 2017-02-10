import React from "react";

import Stop from "./stop";
import styles from "./path.css";

// Must match width and radius values in CSS
const PATH_WIDTH = 292;
const LINE_RADIUS = 20;

function getPathWidth(paths, isRoot = true) {
    let width = 0;
    paths.forEach((path, index) => {
        if (!path.subpaths || (isRoot && index === paths.length - 1)) {
            width += PATH_WIDTH;
        } else {
            width += getPathWidth(path.subpaths, false);
        }
    });
    return isRoot ? (width - PATH_WIDTH - LINE_RADIUS) : width;
}

const Path = props => (
    <div className={styles.root}>
        <div className={styles.header}/>
        {props.stops && props.stops.map((stop, index) =>
            <Stop
                key={index} {...stop} isFirst={!index}
                isLast={!props.subpaths && index === props.stops.length - 1}
            />
        )}

        {props.subpaths &&
            <div>
                <div className={styles.footer} style={{ width: getPathWidth(props.subpaths) }}/>
                <div className={styles.subpaths}>
                    {props.subpaths.map((path, index) => <Path key={index} {...path}/>)}
                </div>
            </div>
        }
    </div>
);

export default Path;
