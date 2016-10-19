import { fetchStop, fetchTimetable, fetchRoutes, fetchMap } from "util/api";
import { createStopStyle } from "util/map";

/**
 * Fetches required props for stop poster component
 * @param id - Stop identifier
 * @returns {Promise}
 */
function fetchStopPosterProps(id) {
    return Promise.all([fetchStop(id), fetchTimetable(id), fetchRoutes(id)])
        .then(([stop, timetable, routes]) => {
            const stops = routes
                .map(route => route.stops)
                .reduce((prev, cur) => [...prev, ...cur], [])
                .filter(({ stopId }) => stopId !== stop.stopId);
            const uniqueStops = [...new Set(stops)];

            const mapOptions = {
                center: [stop.lat, stop.lon],
                width: 1000,
                height: 1000,
                zoom: 15,
                ...createStopStyle([stop], uniqueStops),
            };
            const miniMapOptions = {
                center: [stop.lat, stop.lon],
                width: 300,
                height: 300,
                zoom: 9,
                ...createStopStyle([stop]),
            };

            return Promise.all([fetchMap(mapOptions), fetchMap(miniMapOptions)])
                .then(([mapImage, miniMapImage]) =>
                    ({ stop, timetable, routes, mapImage, miniMapImage }));
        });
}

export {
    fetchStopPosterProps, // eslint-disable-line import/prefer-default-export
};
