import React, { PropTypes } from "react";
import { Table, TableBody, TableHeader, TableHeaderColumn,
         TableRow, TableRowColumn } from "material-ui/Table";

const StopTable = props => (
    <Table selectable multiSelectable>
        <TableHeader displaySelectAll adjustForCheckbox enableSelectAll>
            <TableRow>
                {props.columns.map((column, i) => (
                    <TableHeaderColumn key={i}>{column}</TableHeaderColumn>
                ))}
            </TableRow>
        </TableHeader>

        <TableBody displayRowCheckbox showRowHover deselectOnClickaway={false}>
            {props.rows.map((row, i) => (
                <TableRow key={i} selected={row.isSelected}>
                    {row.values.map((value, j) => (
                        <TableRowColumn key={j}>{value}</TableRowColumn>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

StopTable.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.string).isRequired,
    rows: PropTypes.arrayOf(PropTypes.shape({
        isSelected: PropTypes.bool,
        values: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
    })).isRequired,
};

export default StopTable;
