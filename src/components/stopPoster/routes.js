import React from "react";
import PropTypes from "prop-types";
import { Row, Column } from "components/util";
import CustomTypes from "util/customTypes";

import styles from "./routes.css";

const Routes = props => (
    <div className={styles.root}>
        <Row>
            <Column>
                {props.routes.map((route, index) =>
                    <div className={`${styles.identifier} ${styles.row}`} key={index}>
                        {route.routeId}
                    </div>
                )}
            </Column>
            <Column>
                {props.routes.map((route, index) =>
                    <div className={styles.row} key={index}>
                        <div className={styles.title}>
                            {route.destinationFi}
                        </div>
                        <div className={styles.subtitle}>
                            {route.destinationSe}
                        </div>
                    </div>
                )}
            </Column>
        </Row>
    </div>
);

Routes.propTypes = {
    routes: PropTypes.arrayOf(PropTypes.shape(CustomTypes.route)).isRequired,
};

export default Routes;
