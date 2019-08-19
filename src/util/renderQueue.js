class RenderQueue {
  constructor() {
    this.items = [];
    this.callbacks = [];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  containsOnly(item) {
    return this.items.length === 1 && this.items[0] === item;
  }

  add(item) {
    if (!this.items.includes(item)) {
      this.items.push(item);
    }
  }

  remove(item, options = {}) {
    if (options.error) {
      this.items = [];
      this.callbacks.forEach(({ callback }) => {
        callback(options.error);
      });
      return;
    }

    if (!this.items.includes(item)) {
      return;
    }

    this.items.splice(this.items.indexOf(item), 1);

    this.callbacks.forEach(callbackOptions => {
      const { callback, ignore } = callbackOptions;
      if (this.isEmpty() || this.containsOnly(ignore)) {
        this.callbacks.splice(this.callbacks.indexOf(callbackOptions), 1);
        callback();
      }
    });
  }

  onEmpty(callback, options = {}) {
    if (this.isEmpty() || this.containsOnly(options.ignore)) {
      callback();
    } else {
      this.callbacks.push({ ...options, callback });
    }
  }
}

const renderQueue = new RenderQueue();

export default renderQueue;
