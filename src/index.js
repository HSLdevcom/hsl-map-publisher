import React from "react";
import { render } from "react-dom";
import App from "components/app";
import "styles/base.css";
import "./util/mockGetTemplate";

if (!window.serverLog) {
    window.serverLog = console.log.bind(console);
}

const root = document.body.appendChild(document.createElement("div"));

render(<App/>, root);
