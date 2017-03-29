
/**
 * Returns a function that memoizes the result of func
 * @param {Function} func - Function to memoize
 * @param {number} arity - Number of arguments to memoize
 * @returns {Function}
 */
function memoize(func, arity = 1) {
    const root = new Map();
    const f = (...args) => {
        let map = root;

        for (let i = 0; i < arity - 1; i++) {
            if (map.has(args[i])) {
                map = map.get(args[i]);
            } else {
                const empty = new Map();
                map.set(args[i], empty);
                map = empty;
            }
        }

        const lastArg = args[arity - 1];

        if (map.has(lastArg)) {
            return map.get(lastArg);
        }
        const val = func.apply(this, args);
        map.set(lastArg, val);
        return val;
    };
    f.cache = root;
    return f;
}

export default memoize;
