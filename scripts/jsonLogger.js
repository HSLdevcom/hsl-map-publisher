const fs = require("fs");

class JsonLogger {
    constructor({ path, pageCount }) {
        this.path = path;
        this.status = {
            error: null,
            pageCount,
            pages: [],
        };
        this.flush();
    }

    logPage({ component, props }) {
        this.status.pages.push({
            date: Date.now(),
            component,
            props,
        });
        this.flush();
    }

    logError(error) {
        this.status.error = error.message;
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
