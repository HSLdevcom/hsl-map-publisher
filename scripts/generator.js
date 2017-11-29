const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const puppeteer = require("puppeteer");

const writeFileAsync = promisify(fs.writeFile);

const CLIENT_URL = "http://localhost:3000";
const RENDER_TIMEOUT = 5 * 60 * 1000;
const MAX_RENDER_ATTEMPTS = 3;
const SCALE = 96 / 72;

let browser = null;
let previous = Promise.resolve();

async function initialize() {
    browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    browser.on("disconnected", () => { browser = null; });
}

/**
 * Renders component to PDF file
 * @returns {Promise}
 */
async function renderComponent(options) {
    const {
        component, props, directory, filename, logger,
    } = options;

    const page = await browser.newPage();

    page.on("error", (error) => {
        page.close();
        browser.close();
        logger.logError(error);
    });

    page.on("console", ({ type, text }) => {
        if (["error", "warning", "log"].includes(type)) {
            logger.logInfo(`Console(${type}): ${text}`);
        }
    });

    const encodedProps = encodeURIComponent(JSON.stringify(props));
    await page.goto(`${CLIENT_URL}/?component=${component}&props=${encodedProps}`);

    const viewport = await page.evaluate(() => (
        new Promise((resolve, reject) => {
            window.callPhantom = response =>
                (response.error ? reject(response.error) : resolve(response));
        })
    ));

    await page.emulateMedia("screen");
    const contents = await page.pdf({
        printBackground: true,
        width: viewport.width * SCALE,
        height: viewport.height * SCALE,
        pageRanges: "1",
        scale: SCALE,
    });

    await writeFileAsync(path.join(directory, filename), contents);
    await page.close();
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
            if (!browser) {
                options.logger.logInfo("Creating new browser instance");
                await initialize();
            }
            const timeout = new Promise((resolve, reject) => setTimeout(reject, RENDER_TIMEOUT, new Error("Render timeout")));
            await Promise.race([renderComponent(options), timeout]);
            options.logger.logInfo(`Successfully rendered ${options.filename}\n`);
            return true;
        } catch (error) {
            options.logger.logError(error);
        }
        /* eslint-enable no-await-in-loop */
    }

    options.logger.logError(new Error(`Failed to render ${options.filename}\n`));
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
