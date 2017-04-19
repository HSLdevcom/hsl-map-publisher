const path = require("path");
const driver = require("node-phantom-promise");
const sharp = require("sharp");

const slimerjs = /^win/.test(process.platform) ? "slimerjs.cmd" : "slimerjs";
const slimerPath = path.join(__dirname, "..", "node_modules", ".bin", slimerjs);

const CLIENT_PORT = 3000;
const TILE_SIZE = 2000;

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
    const content = `ERROR: ${error instanceof Error ? error.message : error}`;
    console.error(content); // eslint-disable-line no-console
    if (stream) stream.write(`${content}\n`);
}

async function captureScreenshot(totalWidth, totalHeight, filename) {
    let tiles = [];

    let top = 0;
    while (top < totalHeight) {
        let left = 0;
        let height = Math.min(TILE_SIZE, totalHeight - top);
        while (left < totalWidth) {
            let width = Math.min(TILE_SIZE, totalWidth - left);
            await page.set("clipRect", { top, left, width, height });
            const base64 = await page.renderBase64({ format: "png" });
            const buffer = Buffer.from(base64, "base64");
            tiles.push({ top, left, buffer });
            left += width;
        }
        top += height;
    }

    const options = {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: "black",
    }

    let data = await sharp(null, { create: options }).raw().toBuffer();

    for (const tile of tiles) {
        const { top, left, buffer } = tile;
        data = await sharp(data, { raw: options }).overlayWith(buffer, { top, left }).raw().toBuffer();
    }

    await sharp(data, { raw: options }).toFile(filename);

}

/**
 * Renders component to bitmap file
 * @returns {Promise}
 */
function renderComponent(options) {
    const { component, props, directory, filename } = options;

    return new Promise((resolve, reject) => {
        // Set callback called by client app when component is ready
        page.onCallback = ({ error, width, height }) => {
            page.onCallback = null;
            if (error) {
                reject(error);
                return;
            }
            captureScreenshot(width, height, path.join(directory, filename))
                .then(() => resolve({ width, height }))
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
           return renderComponent(options);
        })
        .catch((error) => {
            logError(error);
        }).then((dimensions) => {
            stream = null;
            return dimensions;
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
