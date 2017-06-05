const moment = require("moment");
const fs = require("fs");

class Logger {
    constructor(path) {
        this.stream = fs.createWriteStream(path);
    }

    logInfo(message) {
        const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
        const content = `${timestamp} INFO: ${message}`;
        console.log(content); // eslint-disable-line no-console
        if (this.stream) this.stream.write(`${content}\n`);
    }

    logError(error) {
        const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
        const content = `${timestamp} ERROR: ${error.message}`;
        console.error(error); // eslint-disable-line no-console
        if (this.stream) this.stream.write(`${content}\n`);
    }

    end(message) {
        this.stream.end(message);
    }
}

module.exports = Logger;
