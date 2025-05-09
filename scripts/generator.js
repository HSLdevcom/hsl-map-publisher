const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const qs = require('qs');
const log = require('./util/log');
const { uploadPosterToCloud } = require('./cloudService');
const moment = require('moment');

const { AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY, PUBLISHER_RENDER_URL } = require('../constants');

const CLIENT_URL = PUBLISHER_RENDER_URL;
const RENDER_TIMEOUT = 10 * 60 * 1000;
const PDF_TIMEOUT = 5 * 60 * 1000;
const MAX_RENDER_ATTEMPTS = 3;
const SCALE = 96 / 72;

let browser = null;
const cwd = process.cwd();

const pdfOutputDir = path.join(cwd, 'output');

const pdfPath = id => path.join(pdfOutputDir, `${id}.pdf`);

async function initialize() {
  browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });
  browser.on('disconnected', () => {
    browser = null;
  });
}

function generateRenderUrl(component, template, props) {
  const generationProps = props.date
    ? props
    : Object.assign(props, { date: moment(Date()).format('YYYY-MM-DD') }); // Add current date by default if request props do not contain it
  const encodedProps = qs.stringify({ component, props: generationProps, template });
  const pageUrl = `${PUBLISHER_RENDER_URL}/?${encodedProps}`;
  return pageUrl;
}

/**
 * Renders component to PDF file
 * @returns {Promise}
 */
async function renderComponent(options) {
  const { id, component, template, props, onInfo, onError } = options;

  const page = await browser.newPage();

  await page.exposeFunction('serverLog', log);

  page.on('error', error => {
    page.close();
    browser.close();
    onError(error);
  });

  page.on('console', message => {
    const { url, lineNumber, columnNumber } = message.location();
    if (['error', 'warning', 'log'].includes(message.type())) {
      onInfo(
        `Console(${message.type()}) on (${url}:${lineNumber}:${columnNumber}):\n${message.text()}`,
      );
    }
  });

  const pageUrl = generateRenderUrl(component, template, props);

  console.log(`Opening ${pageUrl} in Puppeteer.`);

  await page.goto(pageUrl, {
    timeout: RENDER_TIMEOUT,
  });

  const { error = null, width, height } = await page.evaluate(
    () =>
      new Promise(resolve => {
        window.callPhantom = opts => resolve(opts);
      }),
  );

  if (error) {
    throw new Error(error);
  }

  await page.emulateMediaType('screen');

  let printOptions = {};
  if (props.printTimetablesAsA4) {
    printOptions = {
      printBackground: true,
      format: 'A4',
      margin: 0,
      timeout: PDF_TIMEOUT,
    };
  } else if (props.printAsA5) {
    printOptions = {
      printBackground: true,
      format: 'A5',
      margin: 0,
      timeout: PDF_TIMEOUT,
    };
  } else {
    printOptions = {
      printBackground: true,
      width: width * SCALE,
      height: height * SCALE,
      pageRanges: '1',
      scale: SCALE,
    };
  }

  const contents = await page.pdf(printOptions);

  const pdfFilePath = pdfPath(id);
  await fs.outputFile(pdfFilePath, contents);
  await page.close();

  const posterUploaded = await uploadPosterToCloud(pdfFilePath);
  return posterUploaded;
}

async function generate(options) {
  const { onInfo, onError } = options;

  for (let i = 0; i < MAX_RENDER_ATTEMPTS; i++) {
    /* eslint-disable no-await-in-loop */
    try {
      onInfo(i > 0 ? 'Retrying' : 'Rendering');
      if (!browser) {
        onInfo('Creating new browser instance');
        await initialize();
      }
      const timeout = new Promise((resolve, reject) =>
        setTimeout(reject, RENDER_TIMEOUT, new Error('Render timeout')),
      );

      const posterUploaded = await Promise.race([renderComponent(options), timeout]);
      const uploadFailed = !posterUploaded && AZURE_STORAGE_ACCOUNT && AZURE_STORAGE_KEY;

      if (!uploadFailed) {
        onInfo('Rendered successfully.');
      } else {
        const err = { message: 'Rendered successfully but uploading poster failed.', stack: '' };
        throw err;
      }

      return { success: true, uploaded: !uploadFailed };
    } catch (error) {
      onError(error);
    }
    /* eslint-enable no-await-in-loop */
  }

  return { success: false };
}

module.exports = {
  generate,
  generateRenderUrl,
};
