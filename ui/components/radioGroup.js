import React, { PropTypes } from "react";
import { RadioButton, RadioButtonGroup } from "material-ui/RadioButton";

import styles from "./radioGroup.css";

const RadioGroup = props => (
    <RadioButtonGroup name="component" defaultSelected={Object.keys(props.items)[0]}>
        {Object.keys(props.items).map(key => (
            <RadioButton
                key={key}
                value={key}
                label={props.items[key]}
                className={styles.radio}
            />
        ))}
    </RadioButtonGroup>
);

RadioGroup.propTypes = {
    items: PropTypes.objectOf(React.PropTypes.string).isRequired,
};

export default RadioGroup;
