import React from "react";
import clusterfck from "clusterfck";
import { Row } from "components/util";

import styles from "./routes.css";


const MAX_ROWS = 10;

/*
function createGroupKey(route) {
    const routeId = parseInt(route.routeId);
    const keyId = routeId > 100 ? L : S;
    const
}

function calcDistance(route1, route2) {

}

const generalize = (routes) => {
    if(routes.length <= MAX_ROWS) return routes;

    const genRoutes = [...routes];
    const genGroup = [
        (route) => `${parseInt(route.routeId) % 100}-${parseInt(route.routeId) % 1}`,
        (route) => `${parseInt(route.routeId) % 10}-${parseInt(route.routeId) % 1}`,
    ];

    const groupKey = (route) => {

    }

    // TODO: Sort by destination and generalize routes with same destination first?
    generalize at mod 10 & 100
    generalize at mod 10
    generalize at mod 100

    while(routes.length > MAX_ROWS) {
        calc generalizations sort by gain
        execute first
    }
}
*/

function generalize(routes) {
    //

    // Find clusters based on route id for remaining routes
    console.log("CALC K MEANS");
    const routeIds = routes.map(({routeId}) => [parseInt(routeId)]);
    const clusters = clusterfck.kmeans(routeIds, MAX_ROWS);
    console.log(clusters);
}

const Routes = (props) => {
    // generalize(props.routes);
    return (
        <div className={styles.root}>
            {props.routes.map((route, index) =>
                <Row key={index}>
                    <div className={styles.identifier}>{route.routeId}</div>
                    <div>
                        <div className={styles.title}>
                            {route.destination_fi}
                        </div>
                        <div className={styles.subtitle}>
                            {route.destination_se}
                        </div>
                    </div>
                </Row>
            )}
        </div>
    );
};

export default Routes;
