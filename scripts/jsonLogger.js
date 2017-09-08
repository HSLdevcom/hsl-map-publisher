const fs = require("fs");

class JsonLogger {
    constructor({ title, path, pageCount }) {
        this.path = path;
        this.status = {
            title,
            pageCount,
            pages: [],
            date: Date.now(),
        };
        this.flush();
    }

    logPage(options) {
        this.status.pages.push(options);
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
