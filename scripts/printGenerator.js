const driver = require("node-phantom-simple");
const slimerPath = require("slimerjs").path;

// TODO: Get port from common config file
const url = "http://localhost:3000";

// TODO: Fetch actual stop ids from rest api
function fetchStopIds() {
    return Promise.resolve([1, 2, 3, 4, 5]);
}

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
        page.open(url, err => err ? reject(err) : resolve(page));
    });
}

function capture(page, filename) {
    return new Promise((resolve, reject) => {
        page.render(filename, (err, status) => err ? reject(err) : resolve(status));
    });
}

function generatePdf(page, stopId) {
    return new Promise((resolve) => {
        page.onCallback = () => {
            page.onCallback = null;
            capture(page, `${stopId}.png`).then(() => resolve());
        };
        page.evaluate((stopId) => window.setView(stopId), stopId, () => null);
    });
}

function generatePdfs(page) {
    page.onError = (message, stack) => {
        console.error(`Error in client: ${message}`); // eslint-disable-line no-console
        process.exit(1);
    };

    page.onConsoleMessage = (message) => {
        console.log(`Output in client: ${message}`); // eslint-disable-line no-console
    };

    fetchStopIds().then(stopIds => {
        let prev;
        stopIds.forEach(stopId => {
            if(prev) {
                prev = prev.then(() => generatePdf(page, stopId));
            } else {
                prev = generatePdf(page, stopId);
            }
        });
        prev.then(() => process.exit());
    });
}

createBrowser()
    .then(browser => createPage(browser))
    .then(page => open(page))
    .then(page => generatePdfs(page))
    .catch(error => {
        console.error(error); // eslint-disable-line no-console
        process.exit(1);
    });

