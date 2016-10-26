import { fetchStop, fetchTimetable, fetchRoutes, fetchMap } from "util/api";

/**
 * Fetches required props for stop poster component
 * @param id - Stop identifier
 * @returns {Promise}
 */
function fetchStopPosterProps(id) {
    return Promise.all([fetchStop(id), fetchTimetable(id), fetchRoutes(id)])
        .then(([stop, timetable, routes]) => {
            const mapOptions = {
                center: [stop.lat, stop.lon],
                width: 1500,
                height: 1200,
                scale: 1,
                zoom: 15,
            };

            const miniMapOptions = {
                center: [stop.lat, stop.lon],
                width: 450,
                height: 360,
                zoom: 9,
            };

            return Promise
                .all([fetchMap(mapOptions), fetchMap(miniMapOptions)])
                .then(([mapImage, miniMapImage]) => (
                    { mapImage, miniMapImage, mapOptions, miniMapOptions, stop, timetable, routes }
                ));
        });
}

export {
    fetchStopPosterProps, // eslint-disable-line import/prefer-default-export
};
