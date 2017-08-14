const fs = require("fs");

class JsonLogger {
    constructor({ path, pageCount }) {
        this.path = path;
        this.status = {
            pageCount,
            pages: [],
        };
        this.flush();
    }

    logPage(options) {
        this.status.pages.push(Object.assign({}, options, { date: Date.now() }));
        this.flush();
    }

    logError(error) {
        this.status.error = error.message;
        this.flush();
    }

    logSuccess({ filename }) {
        this.status.filename = filename;
        this.flush();
    }

    flush() {
        fs.writeFile(this.path, JSON.stringify(this.status), (error) => {
            if (error) {
                console.error(error); // eslint-disable-line no-console
            }
        });
    }
}

module.exports = JsonLogger;
