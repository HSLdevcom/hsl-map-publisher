import React, { PropTypes } from "react";
import { Row } from "components/util";
import CustomTypes from "util/customTypes";

import styles from "./routes.css";

const Routes = props => (
    <div className={styles.root}>
        {props.routes.map((route, index) =>
            <Row key={index}>
                <div className={styles.identifier}>{route.routeId}</div>
                <div>
                    <div className={styles.title}>
                        {route.destinationFi}
                    </div>
                    <div className={styles.subtitle}>
                        {route.destinationSe}
                    </div>
                </div>
            </Row>
        )}
    </div>
);

Routes.propTypes = {
    routes: PropTypes.arrayOf(PropTypes.shape(CustomTypes.route)).isRequired,
};

export default Routes;
