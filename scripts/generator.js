/* eslint-disable no-await-in-loop */
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
const CSV_TIMEOUT = 10 * 1000;
const PDF_TIMEOUT = 5 * 60 * 1000;
const MAX_RENDER_ATTEMPTS = 3;
const SCALE = 96 / 72;

let browser = null;
const cwd = process.cwd();

const fileOutputDir = path.join(cwd, 'output');

const pdfPath = id => path.join(fileOutputDir, `${id}.pdf`);
const csvPath = id => path.join(fileOutputDir, `${id}.csv`);

async function initialize() {
  browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });
  browser.on('disconnected', () => {
    browser = null;
  });
}

function generateRenderUrl(component, template, props, id) {
  const generationProps = props.date
    ? props
    : Object.assign(props, { date: moment(Date()).format('YYYY-MM-DD') }); // Add current date by default if request props do not contain it

  if (id && component === 'StopRoutePlate') {
    // This is needed to pass the component the same ID as the poster generation, so the filename can be assigned as that.
    generationProps.csvFileName = id;
  }

  const encodedProps = qs.stringify(
    { component, props: generationProps, template },
    { arrayFormat: 'brackets' },
  );
  const pageUrl = `${PUBLISHER_RENDER_URL}/?${encodedProps}`;
  return pageUrl;
}

async function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

async function waitFile(filePath) {
  let fileFinishedDownloading = false;

  const checkResult = err => {
    if (err) {
      fileFinishedDownloading = true;
    } else {
      fileFinishedDownloading = true;
    }
  };

  for (fileFinishedDownloading; fileFinishedDownloading !== true; ) {
    await sleep(1000);
    fs.access(filePath, fs.constants.F_OK, checkResult);
  }

  return true;
}

/**
 * Renders component to PDF or CSV file
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

  const pageUrl = generateRenderUrl(component, template, props, id);

  console.log(`Opening ${pageUrl} in Puppeteer.`);

  if (component === 'StopRoutePlate' && props.downloadTable) {
    // Allow the downloading of CSV file since the component just sends it to the client
    await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: fileOutputDir,
    });

    const csvFilePath = csvPath(id);

    await page.goto(pageUrl);
    await waitFile(csvFilePath);
    const posterUploaded = await uploadPosterToCloud(csvFilePath);
    await page.close();
    return posterUploaded;
  }

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
  if (props.printTimetablesAsA4 || component === 'CoverPage') {
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
  csvPath,
};
