import groupBy from "lodash/groupBy";

function groupKey(shortId) {
    const keyLength = (shortId.charAt(0) === "V" || shortId.charAt(0) === "E") ? 3 : 2;
    return shortId.substring(0, keyLength);
}

function groupStops(stops) {
    return {
        ...groupBy(
            stops
                .filter(({ group }) => !!group.length)
                .sort((a, b) => a.index - b.index),
            "group"
        ),
        ...groupBy(
            stops
                .filter(({ group }) => !group.length)
                .sort((a, b) => a.shortId.localeCompare(b.shortId)),
            ({ shortId }) => groupKey(shortId)
        ),
    };
}

function stopsToRows(stops) {
    return stops.map(({ shortId, nameFi, stopId }) => ({
        isChecked: false,
        title: `${shortId} ${nameFi}`,
        subtitle: `(${stopId})`,
        stopIds: [stopId],
    }));
}

function stopsToGroupRows(stops) {
    const stopsByGroup = groupStops(stops);

    return Object.keys(stopsByGroup).map(group => {
            const stops = stopsByGroup[group];
            return {
                isChecked: false,
                title: group,
                subtitle: `${stops[0].shortId} - ${stops[stops.length - 1].shortId} (${stops.length} pysäkkiä)`,
                stopIds: stops.map(({ stopId }) => stopId),
            };
    });
}

export {
    stopsToRows,
    stopsToGroupRows,
};
