// TODO: Get API URL as env variable
const API_URL = "http://kartat.hsl.fi";

/**
 * Returns whether a route id is a so called number variant
 * @param {String} id - Route id
 * @returns {String}
 */
function isNumberVariant(id) {
    return /.{5}[0-9]/.test(id);
}

function isRailRoute(id) {
    return /^300/.test(id);
}

/**
 * Returns route id without area code or leading zeros
 * @param {String} id - Route id
 * @returns {String}
 */
function trimRouteId(id) {
    if (isRailRoute(id) && isNumberVariant(id)) {
        return id.substring(1, 5).replace(/^300[12]/g, "");
    } else if (isRailRoute(id)) {
        return id.replace(/^300[12]/g, "");
    } else if (isNumberVariant(id)) {
        // Do not show number variants
        return id.substring(1, 5).replace(/^[0]+/g, "");
    }
    return id.substring(1).replace(/^[0]+/g, "");
}

/**
  * Returns true if the route segment is only for dropping off passengers
  */
function isDropOffOnly({ pickupDropoffType }) {
    return pickupDropoffType === null || pickupDropoffType === 2;
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
    fetchMap,
    isNumberVariant,
    trimRouteId,
    isDropOffOnly,
};
