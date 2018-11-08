import React from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash/omit';

import styles from './util.css';

const Row = props => (
  <div className={styles.row} style={props.style}>
    {props.children}
  </div>
);

Row.defaultProps = {
  style: {},
};

Row.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const JustifiedRow = props => (
  <div className={styles.justifiedRow} style={props.style}>
    {props.children}
  </div>
);

JustifiedRow.defaultProps = {
  style: {},
};

JustifiedRow.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const WrappingRow = props => (
  <div className={styles.wrappingRow} style={props.style}>
    {props.children}
  </div>
);

WrappingRow.defaultProps = {
  style: {},
};

WrappingRow.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const Column = props => (
  <div className={styles.column} style={props.style}>
    {props.children}
  </div>
);

Column.defaultProps = {
  style: {},
};

Column.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const CenteringColumn = props => (
  <div className={styles.centeringColumn} style={props.style}>
    {props.children}
  </div>
);

CenteringColumn.defaultProps = {
  style: {},
};

CenteringColumn.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const JustifiedColumn = props => (
  <div className={styles.justifiedColumn} style={props.style}>
    {props.children}
  </div>
);

JustifiedColumn.defaultProps = {
  style: {},
};

JustifiedColumn.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.object, // eslint-disable-line react/forbid-prop-types
};

const Spacer = props => (
  <div style={{ flex: '0 0 auto', width: props.width, height: props.height }} />
);

Spacer.defaultProps = {
  width: 0,
  height: 0,
};

Spacer.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

const FlexSpacer = () => <div style={{ flex: '2' }} />;

const InlineSVG = props => (
  <div
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{ __html: props.src }}
    {...omit(props, 'src')}
  />
);

InlineSVG.propTypes = {
  src: PropTypes.string.isRequired,
};

export {
  Row,
  JustifiedRow,
  WrappingRow,
  Column,
  CenteringColumn,
  JustifiedColumn,
  Spacer,
  FlexSpacer,
  InlineSVG,
};
