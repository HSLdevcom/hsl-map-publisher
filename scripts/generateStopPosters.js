const path = require("path");
const fetch = require("node-fetch");
const generator = require("./pdfGenerator");
const fs = require("fs");
const csv = require("csv");

const API_URL = "http://kartat.hsl.fi";
const OUTPUT_PATH = path.join(__dirname, "..", "output");

function fetchStopIds() {
    return fetch(`${API_URL}/stopIds`).then(response => response.json());
}

function fetchStopsWithShelter() {
    return new Promise(resolve =>
        fs.createReadStream(`${__dirname}/jr_map_pysakit_varustus.txt`).pipe(
            csv.parse({ delimiter: "#", columns: true }, (err, data) => {
                resolve(data.filter(row => row.pysakkityyppi.includes("katos")).map(row => row.tunnus));
            })
        ));
}

async function main() {
    const generatePdf = await generator();

    const stopIds = await fetchStopsWithShelter();

    for (const stopId of stopIds) {
        console.log(`Generating (id: ${stopId})`); // eslint-disable-line no-console
        const options = { stopId };
        const filename = path.join(OUTPUT_PATH, `${stopId}.png`);
        await generatePdf("StopPoster", options, filename); // eslint-disable-line no-await-in-loop
    }
}

main();
