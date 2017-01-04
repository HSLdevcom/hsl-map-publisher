// TODO: Get API URL as env variable
const API_URL = "http://localhost:8000";

/**
 * Returns formatted stop id
 * @param {String} id - Short id
 * @returns {String}
 */
function trimShortId(id) {
    return id.replace(" ", "");
}

/**
 * Returns route id without area code or leading zeros
 * @param {String} id - Route id
 * @returns {String}
 */
function trimRouteId(id) {
    return id.substring(1).replace(/^[0]+/g, "");
}

/**
 * Fetches stop info
 * @param {String} stopId - Stop identifier e.g. 4200210
 * @returns {Promise}
 */
function fetchStop(stopId) {
    return fetch(`${API_URL}/stops/${stopId}`)
        .then(response => response.json())
        .then(stop => ({ ...stop, shortId: trimShortId(stop.shortId) }));
}

/**
 * Fetches all stops
 * @returns {Promise}
 */
function fetchStops() {
    return fetch(`${API_URL}/stops`)
        .then(response => response.json())
        .then(stops => stops.map(stop => ({ ...stop, shortId: trimShortId(stop.shortId) })));
}

/**
 * Fetches timetable for stop
 * @param {String} stopId - Stop identifier e.g. 4200210
 * @returns {Promise} - Object containing departure list for weekdays, saturdays and sundays
 */
function fetchTimetable(stopId) {
    return fetch(`${API_URL}/timetables/${stopId}`)
        .then(response => response.json())
        .then((timetables) => {
            // TODO: Choose timetable that is currently valid
            const departures = timetables[0].departures;
            for (const key of Object.keys(departures)) {
                for (const departure of departures[key]) {
                    departure.routeId = trimRouteId(departure.routeId);
                }
            }
            return departures;
        });
}

/**
 * Fetch all routes that stop at given stop
 * @param {String} stopId - Stop identifier e.g. 4200210
 * @returns {Promise}
 */
function fetchRoutes(stopId) {
    return fetch(`${API_URL}/routesByStop/${stopId}`)
        .then(response => response.json())
        .then((routesById) => {
            const routes = [];
            Object.keys(routesById).forEach((key) => {
                // TODO: Choose route that is currently valid
                const route = routesById[key][0];
                const stops = route.stops.map(stop =>
                    ({ ...stop, shortId: trimShortId(stop.shortId) }));
                const routeId = trimRouteId(key);
                routes.push({ ...route, routeId, stops });
            });
            return routes;
        });
}

/**
 * Returns a map image
 * @param {Object} mapOptions - Options used to generate image
 * @returns {Promise} - Image as data URL
 */
function fetchMap(mapOptions) {
    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: mapOptions }),
    };

    return fetch(`${API_URL}/generateImage`, options)
        .then(response => response.blob())
        .then(blob => new Promise((resolve) => {
            const reader = new window.FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
        }));
}

export {
    fetchStop,
    fetchStops,
    fetchTimetable,
    fetchRoutes,
    fetchMap,
};
