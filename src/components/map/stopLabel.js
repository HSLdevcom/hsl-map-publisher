import React from "react";
import PropTypes from "prop-types";
import { Row } from "components/util";

import styles from "./stopLabel.css";

// Max rows in label
const MAX_LABEL_ROWS = 6;
const MAX_LABEL_CHARS = 36;

const RouteList = (props) => {
    if (props.routes.length > MAX_LABEL_ROWS) {
        let rowLength = 0;
        const components = props.routes.map(({ routeId }, index, routes) => {
            const content = `${routeId}${(index < routes.length - 1) ? ", " : ""}`;
            const isNewLine = rowLength + content.length > MAX_LABEL_CHARS;
            rowLength = isNewLine ? content.length : rowLength + content.length;
            return <span className={styles.route} key={index}>{isNewLine && <br/>}{content}</span>;
        });
        return <div>{components}</div>;
    }
    return (
        <div>
            {props.routes.map((route, index) => (
                <Row key={index}>
                    <span className={styles.route} style={{ width: "2em" }}>{route.routeId}</span>
                    {"\xa0"}
                    {route.destinationFi}
                    {"\xa0"}
                    <span style={{ fontWeight: 300 }}>{route.destinationSe}</span>
                </Row>
            ))}
        </div>
    );
};

RouteList.propTypes = {
    routes: PropTypes.arrayOf(PropTypes.shape({
        routeId: PropTypes.string.isRequired,
        destinationFi: PropTypes.string.isRequired,
        destinationSe: PropTypes.string.isRequired,
    })).isRequired,
};

const StopLabel = props => (
    <div className={styles.label}>
        <div className={styles.title}>{props.nameFi}</div>
        <div className={styles.subtitle}>{props.nameSe}</div>
        <div className={styles.content}>
            <RouteList routes={props.routes}/>
        </div>
    </div>
);

StopLabel.propTypes = {
    ...RouteList.propTypes.routes,
    nameFi: PropTypes.string.isRequired,
    nameSe: PropTypes.string.isRequired,
};

export default StopLabel;
