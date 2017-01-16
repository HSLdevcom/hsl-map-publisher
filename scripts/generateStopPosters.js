"use strict";

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const generator = require("./generator");

const API_URL = "http://localhost:8000";
const OUTPUT_PATH = path.join(__dirname, "..", "output");

function fetchStopIds() {
    return fetch(`${API_URL}/stopIds`).then(response => response.json());
}

function generatePdf(generate, stopId) {
    console.log(`Generating (id: ${stopId})`); // eslint-disable-line no-console
    const options = { stopId };
    const filename = path.join(OUTPUT_PATH, `${stopId}.pdf`);
    return generate("StopPoster", options, filename);
}

generator()
    .then((generate) => {
        return fetchStopIds().then((stopIds) => {
            let prev;
            stopIds.forEach((stopId) => {
                if (prev) {
                    prev = prev.then(() => generatePdf(generate, stopId));
                } else {
                    prev = generatePdf(generate, stopId);
                }
            });
            return prev.then(() => process.exit());
        });
    })
    .catch((error) => {
        console.error(error); // eslint-disable-line no-console
        process.exit(1);
    });

