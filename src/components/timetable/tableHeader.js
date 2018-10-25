import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import styles from "./tableHeader.css";

const TableHeader = props => (
    <div className={classNames(styles.root, {
        [styles.printable]: props.printingAsA4,
    })}
    >
        <div className={classNames(styles.title, { [styles.printable]: props.printingAsA4 })}>
            <span className={styles.strong}>
                {props.title}
            </span>
            &nbsp;&nbsp;
            {props.subtitle}
        </div>

        <div className={classNames(styles.subtitle, { [styles.printable]: props.printingAsA4 })}>
            <div className={styles.strong}>
                Tunti
            </div>
            <div>
                <span className={styles.strong}>
                    min
                </span>
                {" "}
                / linja Ajat ovat arvioituja
            </div>
        </div>

        <div className={classNames(styles.subtitle, { [styles.printable]: props.printingAsA4 })}>
            <div className={styles.strong}>
                Timme
            </div>
            <div>
                <span className={styles.strong}>
                    min
                </span>
                {" "}
                / linje Tiderna är beräknade
            </div>
        </div>
    </div>
);

TableHeader.defaultProps = {
    printingAsA4: false,
};

TableHeader.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    printingAsA4: PropTypes.bool,
};

export default TableHeader;
