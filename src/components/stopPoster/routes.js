import React from "react";
import PropTypes from "prop-types";
import chunk from "lodash/chunk";
import { Row, Column } from "components/util";
import { isTrunkRoute, colorsByMode } from "util/domain";

import styles from "./routes.css";

function getColor(route) {
    if (isTrunkRoute(route.routeId)) {
        return colorsByMode.TRUNK;
    }
    return colorsByMode[route.mode];
}

const Routes = (props) => {
    const routesPerColumn = Math.ceil(props.routes.length / props.columns);
    const routeColumns = chunk(props.routes, routesPerColumn);

    return (
        <div className={styles.root}>
            {routeColumns.map((routes, i) => (
                <Row key={i}>
                    <Column>
                        {routes.map((route, index) => (
                            <div key={index} className={styles.group}>
                                <div className={styles.routeId} style={{ color: getColor(route) }}>
                                    {route.routeId}
                                </div>
                            </div>
                        ))}
                    </Column>
                    <Column>
                        {routes.map((route, index) => (
                            <div key={index} className={styles.group}>
                                <div className={styles.title}>
                                    {route.destinationFi}
                                </div>
                                <div className={styles.subtitle}>
                                    {route.destinationSe}
                                </div>
                            </div>
                        ))}
                    </Column>
                </Row>
            ))}
        </div>
    );
};

Routes.defaultProps = {
    columns: 1,
};

Routes.propTypes = {
    routes: PropTypes.arrayOf(PropTypes.shape({
        routeId: PropTypes.string.isRequired,
        destinationFi: PropTypes.string.isRequired,
        destinationSe: PropTypes.string.isRequired,
    })).isRequired,
    columns: PropTypes.number,
};

export default Routes;
