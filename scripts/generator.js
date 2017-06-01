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
const RENDER_TIMEOUT = 5 * 60 * 1000;
const SLIMER_TIMEOUT = 10 * 1000;
const MAX_RENDER_ATTEMPTS = 3;

let browser;
let page;
let stream;
let previous = Promise.resolve();

function logInfo(message) {
    const content = `INFO: ${message}`;
    console.log(content); // eslint-disable-line no-console
    if (stream) stream.write(`${content}\n`);
}

function logError(error) {
    const content = `ERROR: ${error.message}`;
    console.error(error); // eslint-disable-line no-console
    if (stream) stream.write(`${content}\n`);
}

function isInitialized() {
    if (!browser || !page) {
        return Promise.resolve(false);
    }
    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), SLIMER_TIMEOUT);
        page.evaluate(() => true)
            .then(status => resolve(!!status))
            .catch(() => resolve(false));
    });
}

async function initialize() {
    browser = await driver.create({ path: slimerPath });
    page = await browser.createPage();

    page.onError = error => logError(error);
    page.onConsoleMessage = message => logInfo(message);
}

async function open(component, props, scale = 1) {
    const fragment = `component=${component}&props=${JSON.stringify(props)}&scale=${scale}`;
    const status = await page.open(`http://localhost:${CLIENT_PORT}/${fragment}`);

    if (status !== "success") {
        throw new Error("Failed to open client app");
    }
}

function flushBuffer(buffer, innerStream) {
    return new Promise((resolve, reject) => {
        const decoder = new PNGDecoder();

        decoder.on("error", error => reject(error));
        decoder.pipe(
            concat(([{ width, height, pixels }]) => {
                if (!innerStream.write({ width, height, data: pixels })) {
                    innerStream.once("drain", () => resolve());
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
        const height = Math.min(TILE_SIZE, totalHeight - top);
        while (left < totalWidth) {
            /* eslint-disable no-await-in-loop */
            const width = Math.min(TILE_SIZE, totalWidth - left);
            await page.set("clipRect", { top, left, width, height });
            const base64 = await page.renderBase64({ format: "png" });
            await flushBuffer(Buffer.from(base64, "base64"), tileStream);
            left += width;
            /* eslint-enable no-await-in-loop */
        }
        top += height;
    }

    tileStream.end();

    return new Promise((resolve, reject) => {
        outStream.on("finish", () => resolve());
        outStream.on("error", error => reject(error));
    });
}

/**
 * Renders component to bitmap file
 * @returns {Promise}
 */
function renderComponent(options) {
    const { component, props, directory, filename, scale } = options;

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Render timeout")), RENDER_TIMEOUT);
        // Set callback called by client app when component is ready
        page.onCallback = ({ error, width, height }) => {
            page.onCallback = null;
            if (error) {
                reject(new Error(error));
                return;
            }
            captureScreenshot(width, height, path.join(directory, filename))
                .then(() => resolve({ width, height }))
                .catch(error => reject(error))
                .then(() => clearTimeout(timer));
        };
        open(component, props, scale)
            .catch(error => reject(error));
    });
}

async function renderComponentRetry(options) {
    logInfo(`Rendering ${options.component} to ${options.filename}`);
    logInfo(`Using props ${JSON.stringify(options.props)}`);

    for (let i = 1; i < MAX_RENDER_ATTEMPTS; i++) {
        /* eslint-disable no-await-in-loop */
        try {
            if (!(await isInitialized())) {
                logInfo("Creating new browser instance");
                await initialize();
            }
            const dimensions = await renderComponent(options);
            logInfo(`Successfully rendered ${options.filename}`);
            return dimensions;
        } catch (error) {
            logError(error);
            logInfo("Retrying");
        }
        /* eslint-enable no-await-in-loop */
    }

    logError(new Error(`Failed to render ${options.filename}.`));
    return null;
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
            return renderComponentRetry(options);
        })
        .then((dimensions) => {
            stream = null;
            return dimensions;
        });
    return previous;
}

module.exports = { generate };

