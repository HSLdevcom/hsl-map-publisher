import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './lineTimetable.css';
import LineTimetableHeader from './lineTimetableHeader';
import LineTableColumns from './lineTableColumns';
import AllStopsList from './allStopsList';
import { filter, groupBy, flatten } from 'lodash';
import { scheduleSegments } from '../../util/domain';
import { combineConsecutiveDays } from '../timetable/timetableContainer';

const formatDate = date => {
  const day = date.getDate();
  const monthIndex = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}.${monthIndex}.${year}`;
};

const hasTimedStopRoutes = departuresByRoute => {
  return filter(departuresByRoute, route => route.departuresByStop.length > 1).length > 0;
};

const RouteDepartures = props => {
  const {
    showPrintBtn,
    lang,
    departuresByStop,
    routeIdParsed,
    nameFi,
    nameSe,
    dateBegin,
    dateEnd,
    showTimedStops,
  } = props;

  const mappedWeekdayDepartures = departuresByStop.map(departuresForStop => {
    const {
      mondays,
      tuesdays,
      wednesdays,
      thursdays,
      fridays,
      saturdays,
      sundays,
    } = departuresForStop.departures;

    return {
      stop: departuresForStop.stop,
      combinedDays: combineConsecutiveDays({
        mondays,
        tuesdays,
        wednesdays,
        thursdays,
        fridays,
        saturdays,
        sundays,
      }),
    };
  });

  const hasSeparateFridayDepartures =
    scheduleSegments.fridays in mappedWeekdayDepartures[0].combinedDays;

  return (
    <div>
      <LineTimetableHeader
        routeIdParsed={routeIdParsed}
        nameFi={nameFi}
        nameSe={nameSe}
        showPrintBtn={showPrintBtn}
        lang={lang}
      />
      {hasSeparateFridayDepartures && (
        <div>
          <span className={styles.timetableDays}>Maanantai-Torstai</span>
          <span className={styles.timetableDays}>Måndag-Torsdag</span>
          <span className={styles.timetableDates}>
            {formatDate(new Date(dateBegin))}-{formatDate(new Date(dateEnd))}
          </span>
          <LineTableColumns
            showDivider={!showTimedStops}
            departuresByStop={mappedWeekdayDepartures}
            days={scheduleSegments.weekdaysExclFriday}
          />

          <div className={styles.pageBreak}>&nbsp;</div>
          <LineTimetableHeader routeIdParsed={routeIdParsed} nameFi={nameFi} nameSe={nameSe} />
          <span className={styles.timetableDays}>Perjantai/Fredag</span>
          <span className={styles.timetableDates}>
            {formatDate(new Date(dateBegin))}-{formatDate(new Date(dateEnd))}
          </span>
          <LineTableColumns
            showDivider={!showTimedStops}
            departuresByStop={mappedWeekdayDepartures}
            days={scheduleSegments.fridays}
          />
        </div>
      )}
      {!hasSeparateFridayDepartures && (
        <div>
          <span className={styles.timetableDays}>Maanantai-Perjantai</span>
          <span className={styles.timetableDays}>Måndag-Fredag</span>
          <span className={styles.timetableDates}>
            {formatDate(new Date(dateBegin))}-{formatDate(new Date(dateEnd))}
          </span>
          <LineTableColumns
            showDivider={!showTimedStops}
            departuresByStop={mappedWeekdayDepartures}
            days={scheduleSegments.weekdays}
          />
        </div>
      )}
      <div className={styles.pageBreak}>&nbsp;</div>
      <LineTimetableHeader routeIdParsed={routeIdParsed} nameFi={nameFi} nameSe={nameSe} />
      <span className={styles.timetableDays}>Lauantai/Lördag</span>
      <span className={styles.timetableDates}>
        {formatDate(new Date(dateBegin))}-{formatDate(new Date(dateEnd))}
      </span>
      <LineTableColumns
        showDivider={!showTimedStops}
        departuresByStop={mappedWeekdayDepartures}
        days={scheduleSegments.saturdays}
      />
      <div className={styles.pageBreak}>&nbsp;</div>
      <LineTimetableHeader routeIdParsed={routeIdParsed} nameFi={nameFi} nameSe={nameSe} />
      <span className={styles.timetableDays}>Sunnuntai/Söndag</span>
      <span className={styles.timetableDates}>
        {formatDate(new Date(dateBegin))}-{formatDate(new Date(dateEnd))}
      </span>
      <LineTableColumns
        showDivider={!showTimedStops}
        departuresByStop={mappedWeekdayDepartures}
        days={scheduleSegments.sundays}
      />
      <div className={styles.pageBreak}>&nbsp;</div>
    </div>
  );
};

RouteDepartures.defaultProps = {
  routeIdParsed: '',
  nameFi: '',
  nameSe: '',
  showPrintBtn: '',
  lang: '',
  departuresByStop: {},
  dateBegin: '',
  dateEnd: '',
  showTimedStops: true,
};

RouteDepartures.propTypes = {
  routeIdParsed: PropTypes.string,
  nameFi: PropTypes.string,
  nameSe: PropTypes.string,
  showPrintBtn: PropTypes.string,
  lang: PropTypes.string,
  departuresByStop: PropTypes.object,
  dateBegin: PropTypes.string,
  dateEnd: PropTypes.string,
  showTimedStops: PropTypes.bool,
};

function LineTimetable(props) {
  const { routes } = props;
  const showTimedStops = hasTimedStopRoutes(routes);

  if (showTimedStops) {
    return (
      <div>
        {routes.map(routeWithDepartures => {
          const {
            nameFi,
            nameSe,
            routeIdParsed,
            departuresByStop,
            dateBegin,
            dateEnd,
          } = routeWithDepartures;
          return (
            routeWithDepartures.departuresByStop.length > 0 && (
              <div>
                <RouteDepartures
                  routeIdParsed={routeIdParsed}
                  nameFi={nameFi}
                  nameSe={nameSe}
                  showPrintBtn={props.showPrintBtn}
                  lang={props.lang}
                  departuresByStop={departuresByStop}
                  dateBegin={dateBegin}
                  dateEnd={dateEnd}
                  showTimedStops={showTimedStops}
                />
                <AllStopsList
                  stops={routeWithDepartures.routeSegments.nodes}
                  routeIdParsed={routeIdParsed}
                />
              </div>
            )
          );
        })}
      </div>
    );
  }

  const groupedDepartures = groupBy(routes, 'routeId'); // Group by route ID
  const combinedDeparturesForBothDirections = Object.values(groupedDepartures).map(route => {
    const bothStopDepartures = route.map(direction => {
      return direction.departuresByStop;
    });
    // Combine both starting stops into the same route so they show up side by side in RouteDepartures
    return { ...route[0], departuresByStop: flatten(bothStopDepartures) };
  });

  return (
    <div>
      {combinedDeparturesForBothDirections.map(routeWithDepartures => {
        const {
          nameFi,
          nameSe,
          routeIdParsed,
          departuresByStop,
          dateBegin,
          dateEnd,
        } = routeWithDepartures;
        return (
          <div>
            <RouteDepartures
              routeIdParsed={routeIdParsed}
              nameFi={nameFi}
              nameSe={nameSe}
              showPrintBtn={props.showPrintBtn}
              lang={props.lang}
              departuresByStop={departuresByStop}
              dateBegin={dateBegin}
              dateEnd={dateEnd}
              showTimedStops={showTimedStops}
            />
            <AllStopsList stops={routeWithDepartures.routeSegments.nodes} routeId={routeIdParsed} />
          </div>
        );
      })}
    </div>
  );
}

LineTimetable.defaultProps = {
  routes: {},
  showPrintBtn: false,
  lang: 'fi',
};

LineTimetable.propTypes = {
  line: PropTypes.object.isRequired,
  routes: PropTypes.object,
  showPrintBtn: PropTypes.bool,
  lang: PropTypes.string,
};

export default LineTimetable;
