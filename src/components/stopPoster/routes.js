import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import chunk from "lodash/chunk";
import { WrappingRow, Row, Column } from "components/util";
import CustomTypes from "util/customTypes";

import styles from "./routes.css";

const Routes = (props) => {
    const routesPerColumn = Math.ceil(props.routes.length / props.columns);
    const routeColumns = chunk(props.routes, routesPerColumn);

    return (
        <div className={styles.root}>
            {routeColumns.map(routes => (
                <Row>
                    <Column>
                        {routes.map((route, index) => (
                            <div key={index} className={styles.group}>
                                <div className={styles.routeId}>{route.routeId}</div>
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
    routes: PropTypes.arrayOf(PropTypes.shape(CustomTypes.route)).isRequired,
    columns: PropTypes.number,
};

export default Routes;
