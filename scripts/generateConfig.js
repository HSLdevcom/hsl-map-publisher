const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const CONFIG_FILE = path.join(DIST_DIR, 'config.js');

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

const config = {
  DIGITRANSIT_APIKEY: process.env.DIGITRANSIT_APIKEY,
  DIGITRANSIT_URL: process.env.DIGITRANSIT_URL,
  GENERATE_API_URL: process.env.GENERATE_API_URL,
  JORE_GRAPHQL_URL: process.env.JORE_GRAPHQL_URL,
  REACT_APP_PUBLISHER_SERVER_URL: process.env.REACT_APP_PUBLISHER_SERVER_URL,
  SALES_POINT_DATA_URL: process.env.SALES_POINT_DATA_URL,
};

const content = `window.PublisherConfig = ${JSON.stringify(config)};`;

fs.writeFileSync(CONFIG_FILE, content, 'utf8');
console.log(`Generated ${CONFIG_FILE}`);
