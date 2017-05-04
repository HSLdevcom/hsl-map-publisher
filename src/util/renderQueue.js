
class RenderQueue {
    constructor() {
        this.items = [];
        this.hasErrors = false;
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

        if (this.items.length === 0) {
            if (this.callback) {
                this.callback({ success: !this.hasErrors });
                this.callback = null;
            }
            this.hasErrors = false;
        }
    }

    onEmpty(callback) {
        if (this.items.length === 0) {
            callback({ success: true });
        } else {
            this.callback = callback;
        }
    }
}

const renderQueue = new RenderQueue();

export default renderQueue;
