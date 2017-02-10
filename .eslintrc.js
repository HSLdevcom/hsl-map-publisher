module.exports = {
    parserOptions: {
        "ecmaFeatures": {
            "jsx": true,
            "experimentalObjectRestSpread": true
        }
    },
    extends: "airbnb",
    rules: {
        "indent": ["error", 4],
        "no-plusplus": ["off"],
        "no-restricted-syntax": ["off"],
        "comma-dangle": ["error", {
            "arrays": "always-multiline",
            "objects": "always-multiline",
            "imports": "always-multiline",
            "exports": "always-multiline",
            "functions": "never"
        }],
        "quotes": ["error", "double", {"avoidEscape": true}],
        "react/jsx-indent": ["error", 4],
        "react/jsx-indent-props": ["error", 4],
        "react/jsx-filename-extension": ["error", {"extensions": [".js"]}],
        "react/jsx-tag-spacing": ["error", {"beforeSelfClosing": "never"}],
        "react/jsx-space-before-closing": ["error", "never"],
        "react/no-array-index-key": ["off"],
        "jsx-a11y/img-has-alt": ["off"]
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