import React from "react";
import classNames from "classnames";
import { Row, JustifiedRow, Image } from "components/util";

import busIcon from "icons/bus.svg";
import logoIcon from "icons/logo.svg";
import noSmokingIcon from "icons/nosmoking.svg";

import styles from "./header.css";


const Title = props => (
    <div className={classNames(styles.title, { [styles.small]: props.small })}>
        {props.children}
    </div>
);

const Subtitle = props => (
    <div className={classNames(styles.subtitle, { [styles.small]: props.small })}>
        {props.children}
    </div>
);

const Icon = props => (
    <Image {...props} style={{ height: 160, marginLeft: 15, marginRight: 15 }}/>
);

const Group = props => (
    <div style={{ marginLeft: 15, marginRight: 15 }}>
        {props.children}
    </div>
);

const Header = props => (
    <JustifiedRow>
        <Row>
            <Icon src={busIcon}/>
            <Group>
                <Title>{props.address_fi}</Title>
                <Subtitle>{props.address_se}</Subtitle>
            </Group>
        </Row>

        <Row>
            <Group>
                <Title small>Pysäkkinumero</Title>
                <Subtitle small>Hållplatsnummer</Subtitle>
                <div className={styles.stop}>H1660</div>
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

export default Header;
