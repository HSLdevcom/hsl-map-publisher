const path = require("path");
const driver = require("node-phantom-promise");

const slimerjs = /^win/.test(process.platform) ? "slimerjs.cmd" : "slimerjs";
const slimerPath = path.join(__dirname, "..", "node_modules", ".bin", slimerjs);

const CLIENT_PORT = 3000;
const CLIENT_PPI = 96;

let browser;
let page;
let stream;
let previous = Promise.resolve();

async function open() {
    const status = await page.open(`http://localhost:${CLIENT_PORT}`);

    if (status !== "success") {
        throw new Error("Failed to open client app");
    }
}

function logInfo(message) {
    const content = `INFO: ${message}`;
    console.log(content); // eslint-disable-line no-console
    if (stream) stream.write(`${content}\n`);
}

function logError(error) {
    const content = `ERROR: ${error instanceof Error ? error.message : error}\n`;
    console.error(content); // eslint-disable-line no-console
    if (stream) stream.write(`${content}\n`);
}

function setPaperSize(pixelWidth, pixelHeight) {
    const options = {
        width: `${pixelWidth / CLIENT_PPI}in`,
        height: `${pixelHeight / CLIENT_PPI}in`,
    };
    return new Promise((resolve) => {
        page.set("paperSize", options, () => {
            setTimeout(() => resolve(page), 100);
        });
    });
}

/**
 * Renders component to pdf or bitmap file
 * @returns {Promise}
 */
function render(options) {
    const { component, props, directory, filename } = options;

    return new Promise((resolve, reject) => {
        // Set callback called by client app when component is ready
        page.onCallback = (options) => {
            page.onCallback = null;
            return setPaperSize(page, options.width, options.height)
                .then(() => page.render(path.join(directory, filename)))
                .then(() => resolve())
                .catch(error => reject(error));
        };
        page.evaluate((component, props) => {
            window.setVisibleComponent(component, props);
        }, component, props, () => null);
    });
}

/**
 * Adds component to render queue
 * @param {Object} options
 * @param {Writable} options.stream - Writable stream for log messages
 * @param {string} options.component - React component to render
 * @param {Object} options.props - Props to pass to component
 * @param {string} options.directory - Output directory
 * @param {string} options.filename - Output filename
 * @returns {Promise}
 */
function generate(options) {
    previous = previous
        .then(() => {
           stream = options.stream;
           logInfo(`Generating ${options.filename}`);
           return render(options);
        })
        .catch((error) => {
            logError(error);
        }).then(() => {
            stream = null;
        });
    return previous;
}

async function initialize() {
    browser = await driver.create({ path: slimerPath });
    page = await browser.createPage();

    page.onError = error => logError(error);
    page.onConsoleMessage = message => logInfo(message);

    return new Promise((resolve) => {
        // Initial callback called by client app when ready
        page.onCallback = () => {
            resolve(page);
        };
        open(`http://localhost:${CLIENT_PORT}`);
    });
}

module.exports = { initialize, generate };
