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
                <WrappingRow key={groupIndex} style={{ marginBottom: 5 }}>
                    {destinations.map((destination, index) => (
                        <Row key={index}>
                            <div className={styles.routeId}>{destination.routeId}</div>
                        </Row>
                    ))}
                    <Column style={destinations.length > 1 ? { flexBasis: "100%" } : {}}>
                        <div className={styles.title}>{destinations[0].title}</div>
                        <div className={styles.subtitle}>{destinations[0].subtitle}</div>
                    </Column>
                </WrappingRow>
            ))}
        </div>
    );
};

export default Destinations;
