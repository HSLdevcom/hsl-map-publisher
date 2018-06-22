import React from "react";
import { render } from "react-dom";

import App from "components/app";
import "styles/base.css";

import "./util/mockGetTemplate";

const root = document.body.appendChild(document.createElement("div"));

render(<App/>, root);

if (module.hot) {
    module.hot.accept("components/app", () => {
        const NextApp = require("components/app").default; // eslint-disable-line
        render(<NextApp/>, root);
    });
}
