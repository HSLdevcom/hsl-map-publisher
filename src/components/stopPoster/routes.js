import React from "react";
import { Row } from "components/util";

import styles from "./routes.css";

const routes = [
    {
        id: "31",
        fi: "Munkkiniemi",
        se: "Munkshöjden",
    },
    {
        id: "32",
        fi: "Munkkiniemi",
        se: "Munkshöjden",
    },
    {
        id: "40",
        fi: "Elielinaukio",
        se: "Elielplatsen",
    },
    {
        id: "43",
        fi: "Elielinaukio",
        se: "Elielplatsen",
    },
];

const Routes = () => (
    <div className={styles.root}>
        {routes.map((route, index) =>
            <Row key={index}>
                <div className={styles.identifier}>{route.id}</div>
                <div>
                    <div className={styles.title}>{route.fi}</div>
                    <div className={styles.subtitle}>{route.se}</div>
                </div>
            </Row>
        )}
    </div>
);

export default Routes;
