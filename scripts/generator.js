const fs = require("fs");
const path = require("path");
const driver = require("node-phantom-promise");
const PNGEncoder = require("png-stream").Encoder;
const PNGDecoder = require("png-stream").Decoder;
const concat = require("concat-frames");
const TileMergeStream = require("tile-merge-stream");

const slimerjs = /^win/.test(process.platform) ? "slimerjs.cmd" : "slimerjs";
const slimerPath = path.join(__dirname, "..", "node_modules", ".bin", slimerjs);

const CLIENT_PORT = 3000;
const TILE_SIZE = 3000;

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

function flushBuffer(buffer, stream) {
    return new Promise((resolve, reject) => {
        const decoder = new PNGDecoder();

        decoder.on("error", error => reject(error));
        decoder.pipe(
            concat(([{ width, height, pixels }]) => {
                if (!stream.write({ width, height, data: pixels })) {
                    stream.once("drain", () => resolve());
                } else {
                    process.nextTick(() => resolve());
                }
            })
        );
        decoder.end(buffer);
    });
}

async function captureScreenshot(totalWidth, totalHeight, filename) {
    const tileStream = new TileMergeStream({ width: totalWidth, height: totalHeight, channels: 4 });

    const outStream = tileStream
        .pipe(new PNGEncoder(totalWidth, totalHeight, { colorSpace: "rgba" }))
        .pipe(fs.createWriteStream(filename));

    let top = 0;
    while (top < totalHeight) {
        let left = 0;
        let height = Math.min(TILE_SIZE, totalHeight - top);
        while (left < totalWidth) {
            let width = Math.min(TILE_SIZE, totalWidth - left);
            await page.set("clipRect", {top, left, width, height});
            const base64 = await page.renderBase64({format: "png"});
            await flushBuffer(Buffer.from(base64, "base64"), tileStream);
            left += width;
        }
        top += height;
    }

    tileStream.end();

    return new Promise((resolve, error) => {
        outStream.on("finish", () => resolve());
        outStream.on("error", () => reject(error));
    });
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
           logInfo(`Rendering ${options.component} to ${options.filename}`);
           logInfo(`Using props ${JSON.stringify(options.props)}`);
           return renderComponent(options);
        })
        .catch((error) => {
            logError(error);
        })
        .then((dimensions) => {
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
