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
    dateBegin,
    dateEnd,
    distributionArea,
    distributionOrder,
    posterCount,
    stopType,
  } = props.stop;

  const posterDates =
    dateBegin && dateEnd
      ? ` Voimassaoloaika: ${dateBegin} - ${dateEnd}`
      : `Voimassaoloaikaa ei erikseen määritetty`;

  return (
    <div className={styles.stopRow}>
      <span>{`${shortId} ${nameFi}, ${addressFi}, ${shelterText(stopType)},`}</span>
      <span>{` Ajojärjestys: ${distributionOrder}, ${
        ` Alue: ${distributionArea},` !== null ? distributionArea : ','
      } 
       Julistepaikat: ${posterCount},`}</span>
      <span>{` ${posterDates}`}</span>
    </div>
  );
};

StopRow.propTypes = {
  stop: PropTypes.object.isRequired,
};

const CoverPage = props => {
  const { title, stops } = props;

  const mappedStops = stops.map(stop => {
    return <StopRow stop={stop} />;
  });

  return (
    <div className={styles.coverPageContainer}>
      <div className={styles.title}>{title}</div>
      <br />
      <div>{`Aikatauluja ${mappedStops.length}kpl, Generointipäivä: ${props.date}`}</div>
      <br />
      <ul>{mappedStops}</ul>
    </div>
  );
};

CoverPage.defaultProps = {
  title: '',
  stops: [],
  date: '',
};

CoverPage.propTypes = {
  title: PropTypes.string,
  stops: PropTypes.arrayOf(PropTypes.object),
  date: PropTypes.string,
};

export default CoverPage;
