import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { JustifiedRow, CenteringColumn } from 'components/util';

import styles from './header.css';
import ZoneIcon from './zoneIcon';

const Group = props => <div style={{ marginLeft: 15, marginRight: 15 }}>{props.children}</div>;

Group.propTypes = {
  children: PropTypes.node.isRequired,
};

const Title = props => (
  <div className={classNames(styles.title, { [styles.small]: props.small })}>{props.children}</div>
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

// TODO: Fix alignment of zone letter for each letter.

const Header = props => (
  <JustifiedRow style={{ margin: '0 10px' }}>
    <Group>
      <Title>{props.nameFi}</Title>
      {props.nameSe && <Subtitle>{props.nameSe}</Subtitle>}
    </Group>
    <CenteringColumn>
      <Title small>Pysäkkinumero</Title>
      <Subtitle small>Hållplatsnummer</Subtitle>
      <div className={styles.stop}>{props.shortId.replace(' ', '')}</div>
    </CenteringColumn>
    {props.stopZone && (
      <div className={styles.stopZoneColumn}>
        <div className={styles.zoneHeading}>
          <Title>Vyöhyke</Title>
          <Subtitle>Zon/Zone</Subtitle>
        </div>
        <ZoneIcon zone={props.stopZone} />
      </div>
    )}
  </JustifiedRow>
);

Header.defaultProps = {
  nameSe: null,
};

Header.propTypes = {
  nameFi: PropTypes.string.isRequired,
  nameSe: PropTypes.string,
  shortId: PropTypes.string.isRequired,
  stopZone: PropTypes.string.isRequired,
};

export default Header;
