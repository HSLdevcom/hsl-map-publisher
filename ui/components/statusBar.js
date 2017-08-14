import React from "react";
import PropTypes from "prop-types";

import muiThemeable from "material-ui/styles/muiThemeable";
import { grey200, red500 } from "material-ui/styles/colors";

const StatusBar = (props) => {
    const rootStyle = {
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        height: 25,
        background: grey200,
    };
    const failureStyle = {
        width: `${(props.failure / props.total) * 100}%`,
        background: red500,
    };
    const successStyle = {
        width: `${(props.success / props.total) * 100}%`,
        background: props.muiTheme.palette.primary1Color,
    };

    return (
        <div style={rootStyle}>
            <div style={failureStyle}/>
            <div style={successStyle}/>
        </div>
    );
};

StatusBar.propTypes = {
    total: PropTypes.number.isRequired,
    success: PropTypes.number.isRequired,
    failure: PropTypes.number.isRequired,
    muiTheme: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

export default muiThemeable()(StatusBar);
