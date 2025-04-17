import PropTypes from 'prop-types';
import React, { useRef, useEffect } from 'react';
import StopRoutePlateRow from './stopRoutePlateRow';
import { CSVLink } from 'react-csv';

import styles from './stopRoutePlate.css';
import { forEach } from 'lodash';

const CSVDownload = props => {
  const btnRef = useRef(null);
  useEffect(() => btnRef.current?.click(), [btnRef]);
  return (
    <CSVLink {...props}>
      <span ref={btnRef} />
    </CSVLink>
  );
};

const formatSummaryInfo = (dateBegin, dateEnd, routeDiffs) => {
  let totalRemoved = 0;
  let totalAdded = 0;

  forEach(routeDiffs, diff => {
    const { routeChanges } = diff;
    totalRemoved += routeChanges.removedRoutes.length;
    totalAdded += routeChanges.addedRoutes.length;
  });

  return `
  Aikaväli: ${dateBegin} - ${dateEnd}
  Poistettavia: ${totalRemoved}
  Lisättäviä: ${totalAdded}
  `;
};

const StopRoutePlate = props => {
  const { routeDiffs, downloadTable, dateBegin, dateEnd } = props;

  const csvHeaders = [
    { label: 'Sisältö', key: 'summary' },
    { label: 'Pysäkin nimi', key: 'stop.nameFi' },
    { label: 'Tunnus', key: 'stop.shortId' },
    { label: 'Sijainti', key: 'stop.linkToLocation' },
    { label: 'Koordinaatit', key: 'stop.latLon' },
    { label: 'Muutospäivämäärä (aikaisin)', key: 'routeChanges.formatted.earliestChangeDate' },
    { label: 'Muuttumattomat', key: 'routeChanges.formatted.unchanged' },
    { label: 'Uudet', key: 'routeChanges.formatted.added' },
    { label: 'Poistettavat', key: 'routeChanges.formatted.removed' },
    { label: 'Lopputulos', key: 'routeChanges.formatted.endResult' },
  ];

  const generationSummary = {
    summary: formatSummaryInfo(dateBegin, dateEnd, routeDiffs),
  };

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
      {downloadTable && (
        <CSVDownload
          filename={props.csvFileName ? props.csvFileName : 'unnamed'}
          data={[generationSummary, ...routeDiffs]}
          headers={csvHeaders}
        />
      )}
    </div>
  );
};

StopRoutePlate.defaultProps = {
  downloadTable: false,
};

StopRoutePlate.propTypes = {
  routeDiffs: PropTypes.object.isRequired,
  downloadTable: PropTypes.bool,
  csvFileName: PropTypes.string.isRequired,
  dateBegin: PropTypes.string.isRequired,
  dateEnd: PropTypes.string.isRequired,
};

export default StopRoutePlate;
