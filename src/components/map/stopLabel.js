import React from "react";
import PropTypes from "prop-types";
import uniqBy from "lodash/uniqBy";

import { Row, Column, Spacer } from "components/util";
import { getColor } from "util/domain";

import styles from "./stopLabel.css";

// Max rows in label
const MAX_LABEL_ROWS = 6;
const MAX_LABEL_CHARS = 36;

const RouteList = (props) => {
    if (props.routes.length > MAX_LABEL_ROWS) {
        let rowLength = 0;
        const components = uniqBy(props.routes, route => route.routeId)
            .map((route, index, routes) => {
                const content = `${route.routeId}${(index < routes.length - 1) ? ", " : ""}`;
                const isNewLine = rowLength + content.length > MAX_LABEL_CHARS;
                rowLength = isNewLine ? content.length : rowLength + content.length;
                return (
                    <span className={styles.route} key={index} style={{ color: getColor(route) }}>
                        {isNewLine && <br/>}{content}
                    </span>
                );
            });
        return <div>{components}</div>;
    }
    return (
        <Row>
            <Column>
                {props.routes.map((route, index) => (
                    <div key={index} className={styles.route} style={{ color: getColor(route) }}>
                        {route.routeId}
                    </div>
                ))}
            </Column>
            <Spacer width={6}/>
            <Column>
                {props.routes.map((route, index) => (
                    <div key={index}>
                        <span className={styles.destination}>{route.destinationFi}</span>
                        {"\xa0"}
                        <span className={styles.destinationLight}>{route.destinationSe}</span>
                    </div>
                ))}
            </Column>
        </Row>
    );
};

RouteList.propTypes = {
    routes: PropTypes.arrayOf(PropTypes.shape({
        routeId: PropTypes.string.isRequired,
        destinationFi: PropTypes.string.isRequired,
        destinationSe: PropTypes.string,
    })).isRequired,
};

const StopLabel = props => (
    <div className={styles.label}>
        <div className={styles.title}>{props.nameFi} {props.shortId && `(${props.shortId})`}</div>
        <div className={styles.subtitle}>{props.nameSe}</div>
        <div className={styles.content}>
            <RouteList routes={props.routes}/>
        </div>
    </div>
);

StopLabel.defaultProps = {
    nameSe: null,
    shortId: null,
};

StopLabel.propTypes = {
    ...RouteList.propTypes.routes,
    nameFi: PropTypes.string.isRequired,
    nameSe: PropTypes.string,
    shortId: PropTypes.string,
};

export default StopLabel;
