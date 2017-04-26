import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Row, JustifiedRow, Image } from "components/util";

import busIcon from "icons/bus.svg";
import logoIcon from "icons/logo.svg";
import noSmokingIcon from "icons/nosmoking.svg";

import styles from "./header.css";

const Group = props => (
    <div style={{ marginLeft: 15, marginRight: 15 }}>
        {props.children}
    </div>
);

Group.propTypes = {
    children: PropTypes.node.isRequired,
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
    children: PropTypes.string.isRequired,
    small: PropTypes.bool,
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
    children: PropTypes.string.isRequired,
    small: PropTypes.bool,
};

const Icon = props => (
    <Image {...props} style={{ height: 160, marginLeft: 15, marginRight: 15 }}/>
);

const Header = props => (
    <JustifiedRow>
        <Row>
            <Icon src={busIcon}/>
            <Group>
                <Title>{props.nameFi}</Title>
                <Subtitle>{props.nameSe}</Subtitle>
            </Group>
        </Row>

        <Row>
            <Group>
                <Title small>Pysäkkinumero</Title>
                <Subtitle small>Hållplatsnummer</Subtitle>
                <div className={styles.stop}>{props.shortId}</div>
            </Group>
            <Group>
                <Title small>Lippuvyöhyke</Title>
                <Subtitle small>Resezone</Subtitle>
                <div className={styles.zone}>Helsinki</div>
            </Group>
            <Icon src={noSmokingIcon}/>
            <Icon src={logoIcon}/>
        </Row>
    </JustifiedRow>
);

Header.propTypes = {
    nameFi: PropTypes.string.isRequired,
    nameSe: PropTypes.string.isRequired,
    shortId: PropTypes.string.isRequired,
};

export default Header;
