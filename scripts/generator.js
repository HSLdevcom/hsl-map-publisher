const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const qs = require("qs");
const { promisify } = require("util");
const { spawn } = require("child_process");
const { getTemplate } = require("./store");

const writeFileAsync = promisify(fs.writeFile);

const CLIENT_URL = "http://localhost:5000";
const RENDER_TIMEOUT = 5 * 60 * 1000;
const MAX_RENDER_ATTEMPTS = 3;
const SCALE = 96 / 72;

let browser = null;
let previous = Promise.resolve();

const pdfPath = id => path.join(__dirname, "..", "output", `${id}.pdf`);

async function initialize() {
    browser = await puppeteer.launch({
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-web-security",
        ],
    });
    browser.on("disconnected", () => { browser = null; });
}

/**
 * Renders component to PDF file
 * @returns {Promise}
 */
async function renderComponent(options) {
    const {
        id, component, template, props, onInfo, onError,
    } = options;

    const page = await browser.newPage();

    // Provide the template through this function instead of the URL,
    // as it will contain large SVG files.
    await page.exposeFunction("getTemplate", templateId => getTemplate({ id: templateId }, "svg"));

    page.on("error", (error) => {
        page.close();
        browser.close();
        onError(error);
    });

    page.on("console", ({ type, text }) => {
        if (["error", "warning", "log"].includes(type)) {
            onInfo(`Console(${type}): ${text}`);
        }
    });

    const encodedProps = qs.stringify({ component, props, template });
    const pageUrl = `${CLIENT_URL}/?${encodedProps}`;

    console.log(`Opening ${pageUrl} in Puppeteer.`);

    await page.goto(pageUrl, {
        timeout: RENDER_TIMEOUT,
    });

    const { error = null, width, height } = await page.evaluate(() => (
        new Promise((resolve) => {
            window.callPhantom = opts => resolve(opts);
        })
    ));

    if (error) {
        throw new Error(error);
    }

    await page.emulateMedia("screen");

    let printOptions = {};
    if (props.printTimetablesAsA4) {
        printOptions = {
            printBackground: true,
            format: "A4",
            margin: 0,
        };
    } else {
        printOptions = {
            printBackground: true,
            width: width * SCALE,
            height: height * SCALE,
            pageRanges: "1",
            scale: SCALE,
        };
    }

    const contents = await page.pdf(printOptions);

    await writeFileAsync(pdfPath(id), contents);
    await page.close();
}

async function renderComponentRetry(options) {
    const { onInfo, onError } = options;

    for (let i = 0; i < MAX_RENDER_ATTEMPTS; i++) {
        /* eslint-disable no-await-in-loop */
        try {
            onInfo(i > 0 ? "Retrying" : "Rendering");
            if (!browser) {
                onInfo("Creating new browser instance");
                await initialize();
            }
            const timeout = new Promise((resolve, reject) => setTimeout(reject, RENDER_TIMEOUT, new Error("Render timeout")));
            await Promise.race([renderComponent(options), timeout]);
            onInfo("Rendered successfully");
            return { success: true };
        } catch (error) {
            onError(error);
        }
        /* eslint-enable no-await-in-loop */
    }

    return { success: false };
}

/**
 * Adds component to render queue
 * @param {Object} options
 * @param {string} options.id - Unique id
 * @param {string} options.component - React component to render
 * @param {Object} options.props - Props to pass to component
 * @param {function} options.onInfo - Callback (string)
 * @param {function} options.onError - Callback (Error)
 * @returns {Promise} - Always resolves with { success }
 */
function generate(options) {
    previous = previous.then(() => renderComponentRetry(options));
    return previous;
}

/**
 * Concatenates posters to a multi-page PDF
 * @param {Object} options
 * @param {string[]} options.ids - Ids to concatate
 * @returns {Readable} - PDF stream
 */
function concatenate(ids) {
    const filenames = ids.map(id => pdfPath(id));
    const pdftk = spawn("pdftk", [...filenames, "cat", "output", "-"]);
    pdftk.stderr.on("data", (data) => {
        pdftk.stdout.emit("error", new Error(data.toString()));
    });
    return pdftk.stdout;
}

module.exports = {
    generate,
    concatenate,
};
