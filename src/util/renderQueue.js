
class RenderQueue {
    constructor() {
        this.items = [];
        this.callbacks = [];
        this.hasErrors = false;
    }

    isEmpty() {
        return (this.items.length === 0);
    }

    containsOnly(item) {
        return (this.items.length === 1 && this.items[0] === item);
    }

    add(item) {
        if (!this.items.includes(item)) {
            this.items.push(item);
        }
    }

    remove(item, options = {}) {
        if (!options.success) this.hasErrors = true;

        if (this.items.includes(item)) {
            this.items.splice(this.items.indexOf(item), 1);
        }

        this.callbacks.forEach((callbackOptions) => {
            const { callback, ignore } = callbackOptions;
            if (this.isEmpty() || this.containsOnly(ignore)) {
                this.callbacks.splice(this.callbacks.indexOf(callbackOptions), 1);
                callback({ success: !this.hasErrors });
            }
        });

        if (this.isEmpty()) {
            this.hasErrors = false;
        }
    }

    onEmpty(callback, options = {}) {
        if (this.isEmpty() || this.containsOnly(options.ignore)) {
            callback({ success: !this.hasErrors });
        } else {
            this.callbacks.push({ ...options, callback });
        }
    }
}

const renderQueue = new RenderQueue();

export default renderQueue;
