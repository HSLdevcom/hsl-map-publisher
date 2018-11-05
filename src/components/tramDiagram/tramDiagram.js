import React from "react";
import PropTypes from "prop-types";

import { InlineSVG } from "components/util";
import tramDiagramIcon from "icons/tram_diagram.svg";

import styles from "./tramDiagram.css";

const TramDiagram = ({ height }) => (
    <div className={styles.root} style={{ height }}>
        <div className={styles.componentName}>
            <div className={styles.title}>
                Linjojen reitit
            </div>
            <div className={styles.subtitle}>
                Linjernas rutter
            </div>
        </div>
        <InlineSVG className={styles.diagram} src={tramDiagramIcon}/>
    </div>
);

TramDiagram.propTypes = {
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default TramDiagram;
