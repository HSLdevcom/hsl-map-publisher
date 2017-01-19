"use strict";

const fs = require("fs");
const path = require("path");
const driver = require("node-phantom-simple");

const slimerPath = fs.readFileSync(path.join(__dirname, "../.slimerjs")).toString();

const CLIENT_PORT = 3000;

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
        page.open(`http://localhost:${CLIENT_PORT}`, (error, status) => {
            if(status === "success") {
                resolve(page);
            } else {
                reject(new Error("Failed to open client app"));
            }
        });
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

/**
 * Generates a file from component
 * @param page
 * @param {string} component - React component to render
 * @param {Object} options - Props to pass to component
 * @param {string} filename - Output file
 * @returns {Promise}
 */
function generate(page, component, options, filename) {
    return new Promise((resolve, reject) => {
        // Set callback called by client app when component is ready
        page.onCallback = (output) => {
            page.onCallback = null;
            if (output) {
                // Component generated output directly, save to file
                fs.writeFileSync(filename, output);
                resolve();
            } else {
                // No output, save page as a pdf instead
                return setPaperSize(page)
                    .then(() => capture(page, filename))
                    .then(() => resolve())
                    .catch(error => reject(error));
            }
        };
        page.evaluate((component, options) => {
            window.setVisibleComponent(component, options)
        }, component, options, () => null);
    });
}

function initialize() {
    return new Promise((resolve, reject) => {
        createBrowser()
            .then(browser => createPage(browser))
            .then((page) => {
                page.onError = (message, stack) => {
                    console.error(`Error in client: ${message}`); // eslint-disable-line no-console
                    process.exit(1);
                };
                page.onConsoleMessage = (message) => {
                    console.log(`Output in client: ${message}`); // eslint-disable-line no-console
                };
                // Initial callback called by client app when ready
                page.onCallback = () => {
                    resolve(page);
                };
                return open(page);
            }).catch((error) => {
                reject(error);
            });
    });
}

/**
 * Initializes publisher app in slimerjs and returns generate function
 * @returns {Promise} - Generate function
 */
module.exports = () => initialize().then(page => generate.bind(null, page));
