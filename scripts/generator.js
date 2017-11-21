const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const puppeteer = require("puppeteer");

const writeFileAsync = promisify(fs.writeFile);

const CLIENT_PORT = 3000;
const RENDER_TIMEOUT = 5 * 60 * 1000;
const MAX_RENDER_ATTEMPTS = 3;

let browser = null;
let previous = Promise.resolve();

function isInitialized() {
    return browser !== null;
}

async function initialize() {
    browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    browser.on("disconnected", () => { browser = null; });
    return browser;
}

/**
 * Renders component to PDF file
 * @returns {Promise}
 */
async function renderComponent(options) {
    const { component, props, directory, filename, scale = 1, logger } = options;

    const page = await browser.newPage();

    page.on("error", (error) => {
        page.close();
        logger.logError({ message: error });
        throw error;
    });

    page.on("console", message => logger.logInfo(message));

    const fragment = `component=${component}&props=${JSON.stringify(props)}&scale=${scale}`;
    await page.goto(`http://localhost:${CLIENT_PORT}/${fragment}`);

    const viewport = await page.evaluate(() =>
      new Promise((resolve, reject) => {
          window.callPhantom = response =>
            (response.error ? reject(response.error) : resolve(response));
      })
    );

    await page.emulateMedia("screen");
    const contents = await page.pdf({
        printBackground: true,
        width: viewport.width,
        height: viewport.height,
        pageRanges: "1",
    });

    await writeFileAsync(path.join(directory, filename), contents);
    return page.close();
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
