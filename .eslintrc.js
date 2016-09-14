module.exports = {
    parserOptions: {
        "ecmaFeatures": {
            "jsx": true
        }
    },
    extends: "airbnb",
    rules: {
        "indent": ["error", 4],
        "quotes": ["error", "double", {"avoidEscape": true}],
        "react/prop-types": 0,
        "react/jsx-indent": ["error", 4],
        "react/jsx-filename-extension": ["error", {"extensions": [".js"]}],
        "react/jsx-space-before-closing": ["error", "never"]
    },
    settings: {
        "import/resolver": "webpack"
    },
    env: {
        "browser": true,
        "node": true,
        "es6": true
    },
    "plugins": [
        "react"
    ]
};