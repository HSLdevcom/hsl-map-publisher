import React, { Component } from "react";
import PropTypes from "prop-types";
import { AutoSizer, List } from "react-virtualized";
import { ListItem } from "material-ui/List";
import TextField from "material-ui/TextField";
import IconButton from "material-ui/IconButton";
import Checkbox from "material-ui/Checkbox";
import ClearIcon from "material-ui/svg-icons/content/clear";

import styles from "./stopList.css";

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
        const callback = (event, value) => onCheck(rows[index], value);

        return (
            <div key={key} style={style}>
                <ListItem
                    leftCheckbox={<Checkbox checked={isChecked} onCheck={callback}/>}
                    primaryText={<PrimaryText title={title} subtitle={subtitle}/>}
                    style={{ fontSize: 15 }}
                />
            </div>
        );
    };
}

class StopList extends Component {
    static filterRows(rows, filterValue) {
        return rows.filter(({ title, subtitle }) => (
            `${title}${subtitle}`.toLowerCase().includes(filterValue.toLowerCase())
        ));
    }

    constructor(props) {
        super(props);
        this.state = { rows: props.rows, filterValue: "" };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ rows: StopList.filterRows(nextProps.rows, this.state.filterValue) });
    }

    onFilterValueChange(filterValue) {
        this.setState({
            rows: StopList.filterRows(this.props.rows, filterValue),
            filterValue,
        });
    }

    render() {
        const renderer = rowRenderer(this.state.rows, this.props.onCheck);

        return (
            <div className={styles.root}>
                <TextField
                    onChange={(event, value) => this.onFilterValueChange(value)}
                    value={this.state.filterValue}
                    hintText="Suodata..."
                    fullWidth
                />
                {this.state.filterValue &&
                    <IconButton
                        onTouchTap={() => this.onFilterValueChange("")}
                        style={{ position: "absolute", right: 0 }}
                    >
                        <ClearIcon/>
                    </IconButton>
                }
                <div className={styles.listContainer}>
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                width={width}
                                height={height}
                                rowCount={this.state.rows.length}
                                rowHeight={35}
                                rowRenderer={renderer}
                                tabIndex="none"
                            />
                        )}
                    </AutoSizer>
                </div>
            </div>
        );
    }
}

StopList.propTypes = {
    rows: PropTypes.arrayOf(PropTypes.shape({
        isChecked: PropTypes.bool.isRequired,
        title: PropTypes.string.isRequired,
        subtitle: PropTypes.string.isRequired,
    })).isRequired,
    onCheck: PropTypes.func.isRequired,
};

export default StopList;
