const util = require("util");

module.exports = (...values) => values.forEach(value => console.log(util.inspect(value, {
    showHidden: false,
    depth: null,
})));
