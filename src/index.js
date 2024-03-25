import React from 'react';
import { createRoot } from 'react-dom/client';
import App from 'components/app';
import 'styles/base.css';
import './util/mockGetTemplate';

if (!window.serverLog) {
  window.serverLog = console.log.bind(console);
}

const container = document.body.appendChild(document.createElement('div'));
const root = createRoot(container);

root.render(<App />);
