import busStopIcon from "icons/stopBus.svg";
import trunkStopIcon from "icons/stopTrunk.svg";
import metroStopIcon from "icons/stopMetro.svg";
import trainStopIcon from "icons/stopTrain.svg";
import tramStopIcon from "icons/stopTram.svg";

import { isTrunkRoute, isTramStop, isTrainStop, isMetroStop } from "util/domain";

/**
 * Returns stop symbol as data URL
 * @param {Object} options
 * @param {String[]} options.stopIds - Long stop ids (optional)
 * @param {String[]} options.stopIds - Route ids (optional)
 * @returns {String} - Stop symbol as data URL
 */
function getSymbol(options = { stopIds: [], routeIds: [] }) {
    const { routeIds, stopIds } = options;

    if (routeIds.some(routeId => isTrunkRoute(routeId))) {
        return trunkStopIcon;
    }
    if (stopIds.some(stopId => isTramStop(stopId))) {
        return tramStopIcon;
    }
    if (stopIds.some(stopId => isTrainStop(stopId))) {
        return trainStopIcon;
    }
    if (stopIds.some(stopId => isMetroStop(stopId))) {
        return metroStopIcon;
    }
    return busStopIcon;
}

export {
    getSymbol, // eslint-disable-line import/prefer-default-export
};
