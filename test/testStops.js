/* eslint-disable no-await-in-loop */
const { TEST_PUBLISHER_SERVER_URL } = require('../constants');
const fetch = require('node-fetch');
const _ = require('lodash');
const fs = require('fs');
const { mkdir } = require('fs/promises');
const { finished } = require('node:stream/promises');
const path = require('path');

const stopIds = ['1020105', '1284188', '6301068', '1040411'];

const TEST_RESULTS_PATH = './test/results';

const POSTER_COMPONENTS = {
  TIMETABLE: 'Timetable',
  STOP_POSTER: 'StopPoster',
  A3_STOP_POSTER: 'A3StopPoster',
};

async function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

// Build the body for the poster generation requests
function buildGenerationRequestBody(buildId, component, printAsA4) {
  const props = stopIds.map(stopId => {
    return {
      date: new Date().toISOString().split('T')[0],
      isSummerTime: false,
      legend: true,
      mapZoneSymbols: true,
      mapZones: true,
      minimapZoneSymbols: true,
      minimapZones: true,
      printTimetablesAsA4: printAsA4,
      printTimetablesAsGreyscale: false,
      routeFilter: '',
      salesPoint: true,
      selectedRuleTemplates: [],
      stopId,
      template: 'default',
    };
  });

  return {
    buildId,
    component,
    props,
  };
}

async function sendBuildRequest(requestBody) {
  const buildUrl = `${TEST_PUBLISHER_SERVER_URL}/posters`;
  await fetch(buildUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
}

async function initTestRenderList(buildListName) {
  // First check if list already exists
  const listResponse = await fetch(`${TEST_PUBLISHER_SERVER_URL}/builds`);
  const lists = await listResponse.json();

  const existingList = _.find(lists, list => {
    return _.isEqual(list.title, buildListName);
  });

  if (existingList) {
    console.log('Found old test build list, deleting..');
    await fetch(`${TEST_PUBLISHER_SERVER_URL}/builds/${existingList.id}`, {
      method: 'DELETE',
    });
  }
  console.log('\nAdding new build list..');
  const response = await fetch(`${TEST_PUBLISHER_SERVER_URL}/builds`, {
    method: 'POST',
    body: JSON.stringify({ title: buildListName }),
  });
  return response.json();
}

async function pollForCompletedPosters(listId) {
  console.log('Waiting for posters to generate, this may take a while..');

  let allDownloaded = false;
  const completedPosters = [];
  const failedPosters = [];
  for (allDownloaded; allDownloaded !== true; ) {
    // Slowing down polling..
    await sleep(1000);

    const buildListResponse = await fetch(`${TEST_PUBLISHER_SERVER_URL}/builds/${listId}`);
    const body = await buildListResponse.json();
    _.forEach(body.posters, poster => {
      if (poster.status === 'READY') {
        if (completedPosters.indexOf(poster.id) === -1) {
          completedPosters.push(poster.id);
        }
      }
      if (poster.status === 'FAILED') {
        if (failedPosters.indexOf(poster.id) === -1) {
          failedPosters.push(poster.id);
        }
      }
    });
    const unFinishedPosters = _.filter(body.posters, poster => {
      return poster.status !== 'READY' && poster.status !== 'FAILED';
    });
    if (_.isEqual(unFinishedPosters, [])) {
      console.log('All completed posters downloaded !');
      allDownloaded = true;
    }
  }
  console.log(
    `Completed posters
    ${completedPosters.length}/${stopIds.length * Object.keys(POSTER_COMPONENTS).length}`,
  );
  return completedPosters;
}

async function downloadPosters(buildId) {
  if (fs.existsSync(TEST_RESULTS_PATH)) {
    console.log('Cleaning up old results from', TEST_RESULTS_PATH);
    await fs.rmSync(TEST_RESULTS_PATH, { recursive: true, force: false });
  }
  await fs.mkdirSync(TEST_RESULTS_PATH);

  console.log('Downloading poster PDF..');
  try {
    const pdfRequest = await fetch(`${TEST_PUBLISHER_SERVER_URL}/downloadBuild/${buildId}`);
    const pdfDestination = path.resolve(TEST_RESULTS_PATH, `${buildId}.pdf`);
    const stream = fs.createWriteStream(pdfDestination, { flags: 'wx' });
    await finished(pdfRequest.body.pipe(stream));
  } catch (e) {
    console.log("Couldn't download PDF:", e);
  }
}

async function generateTestPDFs() {
  const buildListName = `LOCAL_TEST_RENDERS`;

  const { id } = await initTestRenderList(buildListName);

  // Generate PDFs for each component
  console.log(`Adding test poster generations to build list ${id}...`);

  const buildRequestBodies = _.map(POSTER_COMPONENTS, component => {
    if (component === POSTER_COMPONENTS.TIMETABLE) {
      return buildGenerationRequestBody(id, component, true);
    }
    return buildGenerationRequestBody(id, component, false);
  });

  _.forEach(buildRequestBodies, async buildRequestBody => {
    await sendBuildRequest(buildRequestBody);
  });

  // Waiting for backend to catch up...
  await sleep(3000);

  await pollForCompletedPosters(id);
  await downloadPosters(id);
}

// Call the function to execute the HTTP POST calls
generateTestPDFs();