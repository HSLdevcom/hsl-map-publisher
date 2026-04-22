/* eslint-disable no-await-in-loop */
const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const qs = require('qs');
const log = require('./util/log');
const { uploadPosterToCloud } = require('./cloudService');
const moment = require('moment');

const { AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY, PUBLISHER_RENDER_URL } = require('../constants');

const RENDER_TIMEOUT = 10 * 60 * 1000;
const PDF_TIMEOUT = 5 * 60 * 1000;
const MAX_RENDER_ATTEMPTS = 3;
const SCALE = 96 / 72;

// Recycle the browser after this many completed renders to prevent Chromium-internal
// heap from growing unboundedly across a long worker lifetime.
const BROWSER_RECYCLE_AFTER = 50;

let browser = null;
let renderCount = 0;
const cwd = process.cwd();

const fileOutputDir = path.join(cwd, 'output');

const pdfPath = id => path.join(fileOutputDir, `${id}.pdf`);
const csvPath = id => path.join(fileOutputDir, `${id}.csv`);

function logMemory(label) {
  const mem = process.memoryUsage();
  const mb = v => `${Math.round(v / 1024 / 1024)}MB`;
  console.log(
    `[memory] ${label} — rss:${mb(mem.rss)} heapUsed:${mb(mem.heapUsed)} heapTotal:${mb(
      mem.heapTotal,
    )} external:${mb(mem.external)}`,
  );
}

async function closeBrowser() {
  if (browser) {
    const b = browser;
    browser = null; // null first so the 'disconnected' handler is a no-op
    try {
      await b.close();
      console.log('[browser] Browser closed.');
    } catch (err) {
      console.error(`[browser] Error closing browser: ${err.message}`);
    }
  }
}

async function initialize() {
  const launchOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  browser = await puppeteer.launch(launchOptions);
  renderCount = 0;
  console.log('[browser] New browser instance launched.');
  logMemory('after browser launch');
  browser.on('disconnected', () => {
    console.log('[browser] Browser disconnected unexpectedly, will re-launch on next job.');
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
    delete generationProps.stopIds; // Remove stopIds from props, since they are fetched from the server due to possibly very large size.
  }

  const encodedProps = qs.stringify(
    { component, props: generationProps, template, id },
    { arrayFormat: 'brackets' },
  );
  const pageUrl = `${PUBLISHER_RENDER_URL}/?${encodedProps}`;
  return pageUrl;
}

async function sleep(millis) {
  return new Promise(resolve => {
    setTimeout(resolve, millis);
  });
}

async function waitFile(filePath) {
  let fileFinishedDownloading = false;

  for (fileFinishedDownloading; !fileFinishedDownloading; ) {
    await sleep(1000);
    fileFinishedDownloading = fs.existsSync(filePath);
  }

  return true;
}

/**
 * Renders component to PDF or CSV file.
 *
 * The caller is responsible for passing an AbortSignal-like token via
 * `options.abortSignal` so this function can close its page when a timeout
 * fires from outside.
 *
 * @returns {Promise<boolean>} posterUploaded
 */
async function renderComponent(options) {
  const { id, component, template, props, onInfo, onError } = options;

  const page = await browser.newPage();
  console.log(`[page] Opened page for ${id}. Open pages: ${(await browser.pages()).length}`);

  // Ensure the page is always closed, even on unexpected throws or timeouts.
  // We track whether close has already been called to avoid double-close errors.
  let pageClosed = false;
  async function safeClosePage() {
    if (!pageClosed) {
      pageClosed = true;
      try {
        await page.close();
        console.log(`[page] Closed page for ${id}.`);
      } catch (err) {
        console.error(`[page] Error closing page for ${id}: ${err.message}`);
      }
    }
  }

  await page.exposeFunction('serverLog', log);

  page.on('error', async error => {
    console.error(`[page] Page crashed for ${id}: ${error.message}`);
    await safeClosePage();
    // Close the whole browser so Chromium doesn't stay in a wedged state.
    await closeBrowser();
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

  console.log(`[render] Opening ${pageUrl} in Puppeteer.`);

  try {
    if (component === 'StopRoutePlate' && (props.downloadTable || props.downloadSummary)) {
      // Allow the downloading of CSV file since the component just sends it to the client instead of actually rendering
      const client = await page.createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: fileOutputDir,
      });

      const csvFilePath = props.downloadSummary ? csvPath(`summary-${id}`) : csvPath(id);

      await page.goto(pageUrl);
      await waitFile(csvFilePath);
      const posterUploaded = await uploadPosterToCloud(csvFilePath);
      await safeClosePage();
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
    await safeClosePage();

    const posterUploaded = await uploadPosterToCloud(pdfFilePath);
    return posterUploaded;
  } catch (err) {
    // Always close the page on any error so we never leak it.
    await safeClosePage();
    throw err;
  }
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

      // Recycle the browser periodically to reclaim Chromium-internal heap.
      if (renderCount > 0 && renderCount % BROWSER_RECYCLE_AFTER === 0) {
        onInfo(`[browser] Recycling browser after ${renderCount} renders to free memory.`);
        logMemory('before browser recycle');
        await closeBrowser();
        await initialize();
        logMemory('after browser recycle');
      }

      // Build a cancellable timeout. We keep a reference so we can clear it
      // after a successful render — otherwise the dangling setTimeout holds a
      // closure alive for up to RENDER_TIMEOUT (10 min) per job.
      let timeoutHandle;
      const timeout = new Promise((resolve, reject) => {
        timeoutHandle = setTimeout(reject, RENDER_TIMEOUT, new Error('Render timeout'));
      });

      let posterUploaded;
      try {
        posterUploaded = await Promise.race([renderComponent(options), timeout]);
      } finally {
        // Always clear the timeout so the closure is released immediately.
        clearTimeout(timeoutHandle);
      }

      const uploadFailed = !posterUploaded && AZURE_STORAGE_ACCOUNT && AZURE_STORAGE_KEY;

      if (!uploadFailed) {
        onInfo('Rendered successfully.');
        renderCount += 1;
        logMemory(`after render #${renderCount} (${options.id})`);
      } else {
        const err = { message: 'Rendered successfully but uploading poster failed.', stack: '' };
        throw err;
      }

      return { success: true, uploaded: !uploadFailed };
    } catch (error) {
      onError(error);
      // If the browser has been nulled (crash / disconnect) let it re-launch on the next attempt.
      // For a timeout the browser is still alive but the page was leaked before this fix —
      // now renderComponent's finally block closes it. If the browser itself looks wedged
      // (e.g. all pages are gone but the process hangs), close it so the next attempt starts fresh.
      if (browser) {
        try {
          const pages = await browser.pages();
          console.log(`[browser] Pages open after error: ${pages.length}`);
        } catch (inspectErr) {
          console.error(
            `[browser] Cannot inspect pages after error, closing browser: ${inspectErr.message}`,
          );
          await closeBrowser();
        }
      }
    }
  }

  return { success: false };
}

module.exports = {
  generate,
  generateRenderUrl,
  csvPath,
  closeBrowser,
};
