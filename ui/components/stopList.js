import React, { PropTypes } from "react";
import { AutoSizer, List } from "react-virtualized";
import { ListItem } from "material-ui/List";
import Checkbox from "material-ui/Checkbox";

const PrimaryText = ({ title, subtitle }) => (
    <span>
        {title}
        <span style={{ opacity: 0.7 }}>
            &nbsp;{subtitle}
        </span>
    </span>
);

PrimaryText.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
};

function rowRenderer(rows, onCheck) {
    return ({ key, index, style }) => { // eslint-disable-line react/prop-types
        const { isChecked, title, subtitle } = rows[index];
        const callback = (event, value) => onCheck(index, value);
        return (
            <div key={key} style={style}>
                <ListItem
                    leftCheckbox={<Checkbox checked={isChecked} onCheck={callback}/>}
                    primaryText={<PrimaryText title={title} subtitle={subtitle}/>}
                />
            </div>
        );
    };
}

const StopList = (props) => {
    const renderer = rowRenderer(props.rows, props.onCheck);

    return (
        <AutoSizer>
            {({ height, width }) => (
                <List
                    width={width}
                    height={height}
                    rowCount={props.rows.length}
                    rowHeight={30}
                    rowRenderer={renderer}
                    tabIndex="none"
                />
            )}
        </AutoSizer>
    );
};

StopList.propTypes = {
    rows: PropTypes.arrayOf(PropTypes.shape({
        isChecked: PropTypes.bool.isRequired,
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string.isRequired,
    })).isRequired,
    onCheck: PropTypes.func.isRequired,
};

export default StopList;
