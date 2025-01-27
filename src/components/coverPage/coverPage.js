import React from 'react';
import PropTypes from 'prop-types';

import styles from './coverPage.css';
import classNames from 'classnames';

function shelterText(stopType) {
  switch (stopType) {
    case '01':
    case '08':
      return 'Lasikatos';
    case '02':
      return 'Teräskatos';
    case '03':
      return 'Terminaali';
    case '04':
      return 'Tolppa';
    case '05':
      return 'Urbankatos';
    case '06':
      return 'Betonikatos';
    case '07':
      return 'Puukatos';
    default:
      return 'Varustelutieto puuttuu';
  }
}

const StopRow = props => {
  const {
    shortId,
    nameFi,
    addressFi,
    distributionArea,
    distributionOrder,
    posterCount,
    stopType,
  } = props.stop;

  return (
    <div className={styles.stopRow}>
      <span>{`${shortId} ${nameFi}, ${addressFi}, ${shelterText(stopType)},`}</span>
      <span>{` Ajojärjestys: ${distributionOrder !== null ? distributionOrder : '-'}, ${
        distributionArea !== null ? `${distributionArea},` : ''
      } Julistepaikat: ${posterCount}`}</span>
    </div>
  );
};

StopRow.propTypes = {
  stop: PropTypes.object.isRequired,
};

const CoverPage = props => {
  const { title, date, stops, dateBegin, dateEnd } = props;

  const mappedStops = stops.map(stop => {
    return <StopRow stop={stop} />;
  });

  return (
    <div className={styles.coverPageContainer}>
      <div className={styles.date}>{date}</div>
      <div
        className={styles.margin}>{`Aikatauluja ${mappedStops.length}kpl, Tuloste: ${title}`}</div>
      <div className={styles.margin}>{`Voimassaolokausi ${dateBegin} - ${dateEnd}`}</div>
      <div className={styles.rowContainer}>{mappedStops}</div>
    </div>
  );
};

CoverPage.defaultProps = {
  title: '',
  stops: [],
  date: '',
  dateBegin: '',
  dateEnd: '',
};

CoverPage.propTypes = {
  title: PropTypes.string,
  stops: PropTypes.arrayOf(PropTypes.object),
  date: PropTypes.string,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
};

export default CoverPage;
