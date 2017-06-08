import React from "react";
import groupBy from "lodash/groupBy";
import { WrappingRow, Column } from "components/util";
import routeCompare from "util/routeCompare";

import styles from "./destinations.css";

const Destinations = (props) => {
    if (!props.destinations) {
        return null;
    }

    const destinations = groupBy(props.destinations.sort(routeCompare), "title");

    return (
        <div className={styles.destinations}>
            {Object.values(destinations).map((routes, index) => (
                <WrappingRow key={index}>
                    {routes.map(({ routeId }) => (
                        <div className={styles.routeId}>
                            {routeId}
                        </div>
                    ))}
                    <Column>
                        <div className={styles.title}>{routes[0].title}</div>
                        <div className={styles.subtitle}>{routes[0].subtitle}</div>
                    </Column>
                </WrappingRow>
            ))}
        </div>
    );
};

export default Destinations;
