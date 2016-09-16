const driver = require("node-phantom-simple");
const slimerPath = require("slimerjs").path;

// TODO: Get port from common config file
const url = "http://localhost:3000";


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

createBrowser()
    .then(browser => createPage(browser))
    .then(page => open(page))
    .then(page => {
        capture(page, "test.png");
    }).catch(error => {
        console.error(error);  // eslint-disable-line no-console
    });
