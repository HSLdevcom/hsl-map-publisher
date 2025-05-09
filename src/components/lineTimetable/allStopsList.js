import React from 'react';
import PropTypes from 'prop-types';
import styles from './allStopsList.css';

const TEXT_LANG = {
  FI: 'fi',
  SE: 'se',
};

const getLineInfoText = (lang, lineId) => {
  let infoText = null;
  switch (lang) {
    case TEXT_LANG.FI:
      infoText = `Linjan ${lineId} pysäkit:`;
      break;

    case TEXT_LANG.SE:
      infoText = `Hållplatser for linje ${lineId}:`;
      break;

    default:
      infoText = '';
  }

  return infoText;
};

const parseStopNames = stops => {
  return {
    namesFi: stops.map(item => {
      return item.stop.nameFi;
    }),
    namesSe: stops.map(item => {
      return item.stop.nameSe;
    }),
  };
};

const StopList = props => {
  const { stops, lang, routeIdParsed } = props;
  return (
    <div className={styles.stopList}>
      <p className={styles.lineInfoText}>{getLineInfoText(lang, routeIdParsed)}</p>
      <p className={styles.stopListText}>{stops.join(' - ')}</p>
    </div>
  );
};

StopList.propTypes = {
  stops: PropTypes.array.isRequired,
  lang: PropTypes.string.isRequired,
  routeIdParsed: PropTypes.string.isRequired,
};

const AllStopsList = props => {
  const { stops, routeIdParsed } = props;
  const parsedStopLists = parseStopNames(stops);
  return (
    <div className={styles.stopListsContainer}>
      <StopList stops={parsedStopLists.namesFi} lang={TEXT_LANG.FI} routeIdParsed={routeIdParsed} />
      <StopList stops={parsedStopLists.namesSe} lang={TEXT_LANG.SE} routeIdParsed={routeIdParsed} />
    </div>
  );
};

AllStopsList.propTypes = {
  stops: PropTypes.array.isRequired,
  routeIdParsed: PropTypes.string.isRequired,
};

export default AllStopsList;
