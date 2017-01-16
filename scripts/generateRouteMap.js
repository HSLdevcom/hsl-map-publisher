"use strict";

const fs = require("fs");
const path = require("path");
const generator = require("./generator");

const OUTPUT_PATH = path.join(__dirname, "..", "output");

const options = {
    routeIds: ["1014", "1016", "1017"],
    options: {
        center: [24.95, 60.18],
        width: 1000,
        height: 1000,
        zoom: 12,
        scale: 2,
    },
};

const filename = path.join(OUTPUT_PATH, `routemap-${Date.now()}.svg`);

generator()
    .then(generate => generate("RouteMap", options, filename))
    .then(() => process.exit())
    .catch(error => {
        console.log(error);
        process.exit(1);
    });
