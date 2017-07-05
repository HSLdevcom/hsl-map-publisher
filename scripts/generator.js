const fs = require("fs");
const path = require("path");
const driver = require("node-phantom-promise");
const sharp = require("sharp");
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
let previous = Promise.resolve();

function isInitialized() {
    if (!browser || !page) {
        return Promise.resolve(false);
    }
    return new Promise((resolve) => {
        setTimeout(() => resolve(false), SLIMER_TIMEOUT);
        page.evaluate(() => true)
            .then(status => resolve(!!status))
            .catch(() => resolve(false));
    });
}

function setCallbacks(logger) {
    page.onError = error => logger.logError({ message: error });
    page.onConsoleMessage = message => logger.logInfo(message);
}

async function initialize() {
    browser = await driver.create({ path: slimerPath });
    page = await browser.createPage();
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
        .pipe(
            sharp(undefined, {
                raw: {
                    width: totalWidth,
                    height: totalHeight,
                    channels: 4,
                },
            }).tiff({
                compression: "lzw",
            }))
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
        setTimeout(() => reject(new Error("Render timeout")), RENDER_TIMEOUT);
        // Set callback called by client app when component is ready
        page.onCallback = ({ error, width, height }) => {
            page.onCallback = null;
            if (error) {
                reject(new Error(error));
                return;
            }
            captureScreenshot(width, height, path.join(directory, filename))
                .then(() => resolve())
                .catch(screenshotError => reject(screenshotError));
        };
        open(component, props, scale)
            .catch(error => reject(error));
    });
}

async function renderComponentRetry(options) {
    options.logger.logInfo(`Rendering ${options.component} to ${options.filename}`);
    options.logger.logInfo(`Using props ${JSON.stringify(options.props)}`);

    for (let i = 0; i < MAX_RENDER_ATTEMPTS; i++) {
        /* eslint-disable no-await-in-loop */
        try {
            if (i > 0) {
                options.logger.logInfo("Retrying");
            }
            if (!(await isInitialized())) {
                options.logger.logInfo("Creating new browser instance");
                await initialize();
            }
            setCallbacks(options.logger);
            await renderComponent(options);
            options.logger.logInfo(`Successfully rendered ${options.filename}`);
            return true;
        } catch (error) {
            options.logger.logError(error);
        }
        /* eslint-enable no-await-in-loop */
    }

    options.logger.logError(new Error(`Failed to render ${options.filename}.`));
    return false;
}

/**
 * Adds component to render queue
 * @param {Object} options
 * @param {Logger} options.logger - Logger instance
 * @param {string} options.component - React component to render
 * @param {Object} options.props - Props to pass to component
 * @param {string} options.directory - Output directory
 * @param {string} options.filename - Output filename
 * @returns {Promise}
 */
function generate(options) {
    previous = previous.then(() => renderComponentRetry(options));
    return previous;
}

module.exports = { generate };
