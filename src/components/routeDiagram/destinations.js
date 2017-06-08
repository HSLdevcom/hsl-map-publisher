import React from "react";
import { Row, Column, Spacer } from "components/util";
import routeCompare from "util/routeCompare";

import styles from "./destinations.css";

const Destinations = (props) => {
    if (!props.destinations) {
        return null;
    }

    const destinations = props.destinations.sort(routeCompare);

    return (
        <div className={styles.destinations}>
            {destinations.map((route, index) => (
                <Row key={index}>
                    <div className={styles.routeId}>{route.routeId}</div>
                    <Spacer width={5}/>
                    <Column>
                        <div className={styles.title}>{route.title}</div>
                        <div className={styles.subtitle}>{route.subtitle}</div>
                    </Column>
                </Row>
            ))}
        </div>
    );
};

export default Destinations;
