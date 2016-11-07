import busStopIcon from "icons/stopBus.svg";
import metroStopIcon from "icons/stopMetro.svg";
import trainStopIcon from "icons/stopTrain.svg";
import tramStopIcon from "icons/stopTram.svg";

/**
 * Returns stop symbol as data URL
 * @param {String} stopId - Stop long id
 * @returns - Stop symbol
 */
function getSymbol(stopId) {
    const stopType = stopId.slice(4, 5);
    switch (stopType) {
    case "4":
        return tramStopIcon;
    case "5":
        return trainStopIcon;
    case "6":
        return metroStopIcon;
    default:
        return busStopIcon;
    }
}

export {
    getSymbol, // eslint-disable-line import/prefer-default-export
};
