import React from "react";
import groupBy from "lodash/groupBy";
import { Row, WrappingRow, Column } from "components/util";
import routeCompare from "util/routeCompare";

import styles from "./destinations.css";

const Destinations = (props) => {
    if (!props.destinations) {
        return null;
    }

    const destinationsByTitle = groupBy(props.destinations.sort(routeCompare), "title");

    return (
        <div className={styles.destinations}>
            {Object.values(destinationsByTitle).map((destinations, groupIndex) => (
                <WrappingRow key={groupIndex}>
                    {destinations.map((destination, index) => (
                        <Row key={index}>
                            <div className={styles.routeId}>{destination.routeId}</div>
                            {(index === destinations.length - 1) &&
                                <Column>
                                    <div className={styles.title}>{destination.title}</div>
                                    <div className={styles.subtitle}>{destination.subtitle}</div>
                                </Column>
                            }
                        </Row>
                    ))}
                </WrappingRow>
            ))}
        </div>
    );
};

export default Destinations;
