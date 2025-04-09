import PropTypes from 'prop-types';
import React from 'react';
import StopPlateRow from './stopPlateRow';

const StopRoutePlate = props => {
  console.log(props);
  const { routeDiffs } = props;
  return (
    <div>
      {routeDiffs.length > 0 &&
        routeDiffs.map(diff => {
          return <StopPlateRow stop={diff.stop} routeChanges={diff.routeChanges} />;
        })}
    </div>
  );
};

StopRoutePlate.propTypes = {
  routeDiffs: PropTypes.object.isRequired,
};

export default StopRoutePlate;
