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

function rowRenderer(rows) {
    return ({ key, index, style }) => ( // eslint-disable-line react/prop-types
        <div key={key} style={style}>
            <ListItem
                primaryText={<PrimaryText {...rows[index]}/>}
                leftCheckbox={<Checkbox/>}
            />
        </div>
    );
}

const StopList = (props) => {
    const renderer = rowRenderer(props.rows);

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
        isSelected: PropTypes.bool.isRequired,
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string.isRequired,
        ids: PropTypes.arrayOf(PropTypes.string).isRequired,
    })).isRequired,
};

export default StopList;
