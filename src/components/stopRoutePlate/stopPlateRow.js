import React from 'react';
import { Row, WrappingRow } from 'components/util';
import PropTypes from 'prop-types';

const StopPlateRow = props => {
  const { stop, routeChanges } = props;
  console.log(routeChanges);
  return (
    <Row>
      <WrappingRow>
        <span>{stop?.nameFi}</span>
        <span>{`${stop?.lat}, ${stop.lon}`}</span>
      </WrappingRow>
    </Row>
  );
};

StopPlateRow.propTypes = {
  stop: PropTypes.object.isRequired,
  routeChanges: PropTypes.object.isRequired,
};

export default StopPlateRow;
