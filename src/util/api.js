
// TODO: Get data from REST API
const stops = [
    {
        address_fi: "Pajamäentie 9",
        address_se: "Smedjebackavägen 9",
    },
    {
        address_fi: "Mannerheimintie 42",
        address_se: "Mannerheimvägen 42",
    },
    {
        address_fi: "Pitäjänmäentie",
        address_se: "Sockenbackavägen",
    },
    {
        address_fi: "Fredrikinkatu 55",
        address_se: "Fredriksgatan 55",
    },
];

/**
 * Fetches stop info
 * @param {Number} id - Stop identifier
 * @returns {Promise}
 */
function fetchStopInfo(id) {
    return new Promise(resolve => {
        setTimeout(resolve(stops[id % 4]), 1000);
    });
}

export {
    fetchStopInfo, // eslint-disable-line import/prefer-default-export
};
