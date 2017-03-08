import { PropTypes } from "react";


const stop = {
    stopId: PropTypes.string.isRequired,
    shortId: PropTypes.string.isRequired,
    name_fi: PropTypes.string.isRequired,
    name_se: PropTypes.string.isRequired,
    address_fi: PropTypes.string.isRequired,
    address_se: PropTypes.string.isRequired,

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
    destination_fi: PropTypes.string.isRequired,
    destination_se: PropTypes.string.isRequired,
    stops: PropTypes.arrayOf(PropTypes.shape({ ...stop, duration: PropTypes.number.isRequired })),
};

const departure = {
    hours: PropTypes.number.isRequired,
    minutes: PropTypes.number.isRequired,
    isAccessible: PropTypes.bool.isRequired,
    isFridayOnly: PropTypes.bool.isRequired,
};

const mapOptions = {
    center: PropTypes.arrayOf(PropTypes.number).isRequired,
    zoom: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    scale: PropTypes.number,
};

export default { stop, route, departure, mapOptions };

