const path = require("path");
const driver = require("node-phantom-promise");

const slimerjs = /^win/.test(process.platform) ? "slimerjs.cmd" : "slimerjs";
const slimerPath = path.join(__dirname, "..", "node_modules", ".bin", slimerjs);

const CLIENT_PORT = 3000;
const CLIENT_PPI = 96;

async function open(page) {
    const status = await page.open(`http://localhost:${CLIENT_PORT}`);

    if (status !== "success") {
        throw new Error("Failed to open client app");
    }
    return page;
}

function setPaperSize(page, pixelWidth, pixelHeight) {
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
        page.onCallback = (options) => {
            page.onCallback = null;
            // Save page as a pdf
            return setPaperSize(page, options.width, options.height)
                .then(() => page.render(filename))
                .then(() => resolve())
                .catch(error => reject(error));
        };
        page.evaluate((component, options) => {
            window.setVisibleComponent(component, options);
        }, component, options, () => null);
    });
}

async function initialize() {
    const browser = await driver.create({ path: slimerPath });

    const page = await browser.createPage();

    page.onError = (message) => {
        console.error(`Error in client: ${message}`); // eslint-disable-line no-console
        process.exit(1);
    };
    page.onConsoleMessage = (message) => {
        console.log(`Output in client: ${message}`); // eslint-disable-line no-console
    };

    return new Promise((resolve) => {
        // Initial callback called by client app when ready
        page.onCallback = () => {
            resolve(page);
        };
        open(page);
    });
}

/**
 * Initializes publisher app in slimerjs and returns generate function
 * @returns {Promise} - Generate function
 */
module.exports = async () => {
    const page = await initialize();
    return generate.bind(null, page);
};
