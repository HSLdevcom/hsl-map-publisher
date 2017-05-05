import React from "react";
import PropTypes from "prop-types";
import { RadioButton, RadioButtonGroup } from "material-ui/RadioButton";

import styles from "./radioGroup.css";

const RadioGroup = props => (
    <RadioButtonGroup
        name="component"
        valueSelected={props.valueSelected}
        onChange={(event, value) => props.onChange(value)}
    >
        {Object.keys(props.valuesByLabel).map(label => (
            <RadioButton
                key={label}
                label={label}
                value={props.valuesByLabel[label]}
                className={styles.radio}
            />
        ))}
    </RadioButtonGroup>
);

RadioGroup.propTypes = {
    valuesByLabel: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    valueSelected: PropTypes.any.isRequired, // eslint-disable-line react/forbid-prop-types
    onChange: PropTypes.func.isRequired,
};

export default RadioGroup;
