"use strict";

var fs = require("fs");
var path = require("path");
const driver = require("node-phantom-simple");

const slimerPath = fs.readFileSync(path.join(__dirname, "../.slimerjs")).toString();

// TODO: Get config from common config file
const config = {
    port: 3000,
    outputPath: "output",
};

// TODO: Fetch actual stop ids from rest api
function fetchStopIds() {
    return Promise.resolve([1, 2, 3, 4, 5]);
}

function createBrowser() {
    return new Promise((resolve, reject) => {
        driver.create({path: slimerPath}, (err, browser) => err ? reject(err) : resolve(browser));
    });
}

function createPage(browser) {
    return new Promise((resolve, reject) => {
        browser.createPage((err, page) => err ? reject(err) : resolve(page));
    });
}

function open(page) {
    return new Promise((resolve, reject) => {
        page.open(`http://localhost:${config.port}`, err => err ? reject(err) : resolve(page));
    });
}

function capture(page, filename) {
    return new Promise((resolve, reject) => {
        page.render(filename, (err, status) => err ? reject(err) : resolve(status));
    });
}

function setPaperSize(page) {
    return new Promise((resolve) => {
        // TODO: Get content size from callback. Define dimensions in mm instead of using magic zoom factors.
        page.set("paperSize", {width: "2296px", height:"3385px"}, () => {
            page.set("zoomFactor", 1.278, () => {
                setTimeout(() => resolve(page), 100);
            });
        });
    });
}

function generatePdf(page, stopId) {
    console.log(`Generating (id: ${stopId})`); // eslint-disable-line no-console
    return new Promise((resolve) => {
        page.onCallback = () => {
            page.onCallback = null;
            const filename = path.join(config.outputPath, `${stopId}.pdf`);
            setPaperSize(page)
                .then(() => capture(page, filename))
                .then(() => resolve())
                .catch(error => console.error(error));
        };
        page.evaluate((stopId) => window.setView(stopId), stopId, () => null);
    });
}

function generatePdfs(page) {
    try {
        fs.mkdirSync(config.outputPath);
    } catch(error) {
        if(error.code !== "EEXIST") throw error;
    }

    page.onError = (message, stack) => {
        console.error(`Error in client: ${message}`); // eslint-disable-line no-console
        process.exit(1);
    };

    page.onConsoleMessage = (message) => {
        console.log(`Output in client: ${message}`); // eslint-disable-line no-console
    };

    fetchStopIds().then(stopIds => {
        let prev;
        stopIds.forEach(stopId => {
            if(prev) {
                prev = prev.then(() => generatePdf(page, stopId));
            } else {
                prev = generatePdf(page, stopId);
            }
        });
        prev.then(() => process.exit());
    });
}

createBrowser()
    .then(browser => createPage(browser))
    .then(page => open(page))
    .then(page => generatePdfs(page))
    .catch(error => {
        console.error(error); // eslint-disable-line no-console
        process.exit(1);
    });

