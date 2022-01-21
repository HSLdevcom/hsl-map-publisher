const { Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');
const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const qs = require('qs');
const log = require('./util/log');
const { uploadPosterToCloud } = require('./cloudService');

const { addEvent, updatePoster } = require('./store');

const {
  AZURE_STORAGE_ACCOUNT,
  AZURE_STORAGE_KEY,
  REDIS_CONNECTION_STRING,
} = require('../constants');

const CLIENT_URL = 'http://localhost:5000';
const RENDER_TIMEOUT = 10 * 60 * 1000;
const A3_RENDER_TIMEOUT = 2 * 60 * 1000;
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

  page.on('console', ({ type, text }) => {
    if (['error', 'warning', 'log'].includes(type)) {
      onInfo(`Console(${type}): ${text}`);
    }
  });

  const encodedProps = qs.stringify({ component, props, template });
  const pageUrl = `${CLIENT_URL}/?${encodedProps}`;

  console.log(`Opening ${pageUrl} in Puppeteer.`);

  await page.goto(pageUrl, {
    timeout: component === 'A3StopPoster' ? A3_RENDER_TIMEOUT : RENDER_TIMEOUT,
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

  await page.emulateMedia('screen');

  let printOptions = {};
  if (props.printTimetablesAsA4) {
    printOptions = {
      printBackground: true,
      format: 'A4',
      margin: 0,
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
  if (component === 'A3StopPoster') {
    printOptions = {
      printBackground: true,
      width: 1191,
      height: 842,
      margin: 0,
    };
  }

  const contents = await page.pdf(printOptions);

  const pdfFilePath = pdfPath(id);
  await fs.outputFile(pdfFilePath, contents);
  await page.close();

  const posterUploaded = await uploadPosterToCloud(pdfFilePath);
  return posterUploaded;
}

async function renderComponentRetry(options) {
  const { onInfo, onError, component } = options;

  for (let i = 0; i < MAX_RENDER_ATTEMPTS; i++) {
    /* eslint-disable no-await-in-loop */
    try {
      onInfo(i > 0 ? 'Retrying' : 'Rendering');
      if (!browser) {
        onInfo('Creating new browser instance');
        await initialize();
      }
      const timeout = new Promise((resolve, reject) =>
        setTimeout(
          reject,
          component === 'A3StopPoster' ? A3_RENDER_TIMEOUT : RENDER_TIMEOUT,
          new Error('Render timeout'),
        ),
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

async function generate(options) {
  const { id } = options;

  const onInfo = (message = 'No message.') => {
    console.log(`${id}: ${message}`); // eslint-disable-line no-console
    addEvent({
      posterId: id,
      type: 'INFO',
      message,
    });
  };
  const onError = error => {
    console.error(`${id}: ${error.message} ${error.stack}`); // eslint-disable-line no-console
    addEvent({
      posterId: id,
      type: 'ERROR',
      message: error.message,
    });
  };

  const { success, uploaded } = await renderComponentRetry({
    ...options,
    onInfo,
    onError,
  });

  updatePoster({
    id,
    status: success && uploaded ? 'READY' : 'FAILED',
  });
}

const bullRedisConnection = new Redis(REDIS_CONNECTION_STRING, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue scheduler to restart stopped jobs.
const queueScheduler = new QueueScheduler('publisher', {
  connection: bullRedisConnection,
});

// Worker implementation
const worker = new Worker(
  'publisher',
  async job => {
    const { options } = job.data;
    await generate(options);
  },
  {
    connection: bullRedisConnection,
  },
);

console.log('Worker ready for jobs!');

worker.on('active', job => {
  console.log(`Started to process ${job.id}`);
});

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});

worker.on('drained', () => console.log('Job queue empty! Waiting for new jobs...'));

process.on('SIGINT', () => {
  console.log('Shutting down worker...');
  worker.close(true);
  queueScheduler.close();
  process.exit(0);
});
