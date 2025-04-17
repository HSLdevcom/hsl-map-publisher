import React from 'react';
import PropTypes from 'prop-types';
import styles from './stopRoutePlateRow.css';

const strToParagraph = str => <p>{str}</p>;

const StopRoutePlateRow = props => {
  const { stop, routeChanges } = props;

  const unchangedRoutes = routeChanges?.formatted.unchanged.map(strToParagraph);
  const added = routeChanges?.formatted.added.map(strToParagraph);
  const removed = routeChanges?.formatted.removed.map(strToParagraph);
  const endResults = routeChanges?.formatted.endResult.map(strToParagraph);

  return (
    <tr>
      <td>{stop?.nameFi}</td>
      <td>{stop?.shortId}</td>
      <td>
        <a href={stop?.linkToLocation} target="_blank" rel="noreferrer">
          Pysäkki kartalla
        </a>
      </td>
      <td>{`${stop?.lat}, ${stop.lon}`}</td>
      <td>{unchangedRoutes}</td>
      <td>{added}</td>
      <td>{removed}</td>
      <td>{endResults}</td>
    </tr>
  );
};

StopRoutePlateRow.propTypes = {
  stop: PropTypes.object.isRequired,
  routeChanges: PropTypes.object.isRequired,
};

export default StopRoutePlateRow;
