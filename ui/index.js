import React from "react";
import { render } from "react-dom";
import injectTapEventPlugin from "react-tap-event-plugin";

import { AppContainer } from "react-hot-loader";

import App from "components/app";

import "styles/base.css";

injectTapEventPlugin();

const root = document.body.appendChild(document.createElement("div"));

render(<AppContainer><App/></AppContainer>, root);

if (module.hot) {
    module.hot.accept("components/app", () => {
        const NextApp = require("components/app").default; // eslint-disable-line
        render(<AppContainer><NextApp/></AppContainer>, root);
    });
}
