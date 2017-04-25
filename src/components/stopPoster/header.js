import React from "react";
import classNames from "classnames";
import { JustifiedRow, CenteringColumn, Image } from "components/util";

import busIcon from "icons/bus.svg";

import styles from "./header.css";

const Group = props => (
    <div style={{ marginLeft: 15, marginRight: 15 }}>
        {props.children}
    </div>
);

Group.propTypes = {
    children: React.PropTypes.node.isRequired,
};

const Title = props => (
    <div className={classNames(styles.title, { [styles.small]: props.small })}>
        {props.children}
    </div>
);

Title.defaultProps = {
    small: false,
};

Title.propTypes = {
    children: React.PropTypes.string.isRequired,
    small: React.PropTypes.bool,
};

const Subtitle = props => (
    <div className={classNames(styles.subtitle, { [styles.small]: props.small })}>
        {props.children}
    </div>
);

Subtitle.defaultProps = {
    small: false,
};

Subtitle.propTypes = {
    children: React.PropTypes.string.isRequired,
    small: React.PropTypes.bool,
};

const Icon = props => (
    <Image {...props} style={{ height: 180, marginLeft: 0, marginRight: 30 }}/>
);

const Header = props => (
    <JustifiedRow style={{ margin: "0 10px" }}>
        <div style={{ display: "flex", flexDirection: "row" }}>
            <Icon src={busIcon}/>
            <Group>
                <Title>{props.nameFi}</Title>
                <Subtitle>{props.nameSe}</Subtitle>
            </Group>
        </div>
        <CenteringColumn>
            <Title small>Lippuvyöhyke</Title>
            <Subtitle small>Resezon</Subtitle>
            <div className={styles.zone}>Helsinki</div>
        </CenteringColumn>
        <CenteringColumn>
            <Title small>Pysäkkinumero</Title>
            <Subtitle small>Hållplatsnummer</Subtitle>
            <div className={styles.stop}>{props.shortId}</div>
        </CenteringColumn>
    </JustifiedRow>
);

Header.propTypes = {
    nameFi: React.PropTypes.string.isRequired,
    nameSe: React.PropTypes.string.isRequired,
    shortId: React.PropTypes.string.isRequired,
};

export default Header;
