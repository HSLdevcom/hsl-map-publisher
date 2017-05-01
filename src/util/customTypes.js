import PropTypes from "prop-types";

const stop = {
    stopId: PropTypes.string.isRequired,
    shortId: PropTypes.string.isRequired,
    nameFi: PropTypes.string.isRequired,
    nameSe: PropTypes.string.isRequired,
    addressFi: PropTypes.string.isRequired,
    addressSe: PropTypes.string.isRequired,

    lon: PropTypes.number.isRequired,
    lat: PropTypes.number.isRequired,
    heading: PropTypes.string.isRequired,

    platform: PropTypes.string.isRequired,
    terminalId: PropTypes.string.isRequired,
    stopAreaId: PropTypes.string.isRequired,
};

const route = {
    dateBegin: PropTypes.string.isRequired,
    dateEnd: PropTypes.string.isRequired,
    direction: PropTypes.string.isRequired,
    destinationFi: PropTypes.string.isRequired,
    destinationSe: PropTypes.string.isRequired,
    stops: PropTypes.arrayOf(PropTypes.shape({ ...stop, duration: PropTypes.number.isRequired })),
};

const mapOptions = {
    center: PropTypes.arrayOf(PropTypes.number).isRequired,
    zoom: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    scale: PropTypes.number,
};

export default { stop, route, mapOptions };
