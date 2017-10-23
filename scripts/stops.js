const fs = require("fs");
const iconv = require("iconv-lite");
const csv = require("csv");
const fetch = require("node-fetch");

const API_URL = "http://kartat.hsl.fi/jore/graphql";

async function fetchStopIds() {
    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "query AllStops {allStops { nodes { stopId}} }" }),
    };

    const response = await fetch(API_URL, options);
    const json = await response.json();
    return json.data.allStops.nodes.map(stop => stop.stopId);
}

function fetchAllStops() {
    return new Promise((resolve, reject) => {
        fs.createReadStream(`${__dirname}/stops.csv`)
            .pipe(iconv.decodeStream("ISO-8859-1"))
            .pipe(csv.parse({ delimiter: "#", columns: true }, (err, data) => {
                if (err) reject(err);
                const stops = data
                    .map(stop => ({
                        stopId: stop.tunnus,
                        shortId: stop.lyhyt_nro,
                        nameFi: stop.nimi_suomi,
                        group: `${stop.aikataulutyyppi_hsl}${stop.aikataulutyyppi_hkl}`,
                        index: stop.ajojarjestys,
                        hasShelter: stop.pysakkityyppi.includes("katos") &&
                            !(stop.lyhyt_nro.startsWith("Ki")
                                && stop.pysakkityyppi.includes("teräskatos")),
                    }))
                    .sort((a, b) => a.shortId.localeCompare(b.shortId));
                resolve(stops);
            }));
    });
}

async function fetchStops() {
    const stops = await fetchAllStops();
    const stopIds = await fetchStopIds();
    return stops.filter(stop => stopIds.includes(stop.stopId));
}

module.exports = fetchStops;
