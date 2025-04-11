import PropTypes from 'prop-types';
import React from 'react';
import StopRoutePlateRow from './stopRoutePlateRow';
import { CSVDownload } from 'react-csv';

import styles from './stopRoutePlate.css';

const StopRoutePlate = props => {
  const { routeDiffs, downloadTable } = props;

  const csvHeaders = [
    { label: 'Pysäkin nimi', key: 'stop.nameFi' },
    { label: 'Tunnus', key: 'stop.shortId' },
    { label: 'Sijainti', key: 'stop.linkToLocation' },
    { label: 'Koordinaatit', key: 'stop.latLon' },
    { label: 'Muuttumattomat', key: 'routeChanges.formatted.unchanged' },
    { label: 'Uudet', key: 'routeChanges.formatted.added' },
    { label: 'Poistettavat', key: 'routeChanges.formatted.removed' },
    { label: 'Lopputulos', key: 'routeChanges.formatted.endResult' },
  ];

  return (
    <div>
      {!downloadTable && (
        <div>
          <table className={styles.rowContainer}>
            <tr>
              <th>Pysäkin nimi</th>
              <th>Tunnus</th>
              <th>Linkki</th>
              <th>Koordinaatit</th>
              <th>Muuttumattomat</th>
              <th>Uudet</th>
              <th>Poistettavat</th>
              <th>Lopputulos</th>
            </tr>
            {routeDiffs.length > 0 &&
              routeDiffs.map(diff => {
                return <StopRoutePlateRow stop={diff.stop} routeChanges={diff.routeChanges} />;
              })}
          </table>
        </div>
      )}
      {downloadTable && <CSVDownload data={routeDiffs} headers={csvHeaders} />}
    </div>
  );
};

StopRoutePlate.defaultProps = {
  downloadTable: false,
};

StopRoutePlate.propTypes = {
  routeDiffs: PropTypes.object.isRequired,
  downloadTable: PropTypes.bool,
};

export default StopRoutePlate;
