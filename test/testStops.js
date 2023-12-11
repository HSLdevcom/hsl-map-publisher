const { TEST_PUBLISHER_SERVER_URL } = require('../constants');
const fetch = require('node-fetch');
const _ = require('lodash');

const stopIds = ['1020105', '1284188', '6301068', '1040411'];

const POSTER_COMPONENTS = {
  TIMETABLE: 'Timetable',
  STOP_POSTER: 'StopPoster',
  A3_STOP_POSTER: 'A3StopPoster',
};

// Build the body for the poster generation requests
async function buildGenerationRequestBody(buildId, component, printAsA4) {
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

async function generateTestPDFs() {
  const buildListName = `LOCAL_TEST_RENDERS`;
  const printAsA4 = false;

  const { id } = await initTestRenderList(buildListName);

  // Generate PDFs for each component
  console.log(`Adding test poster generations to build list ${id}...`);
  _.forEach(POSTER_COMPONENTS, async component => {
    const requestBody = await buildGenerationRequestBody(id, component, printAsA4);
    const buildUrl = `${TEST_PUBLISHER_SERVER_URL}/posters`;
    const buildResponse = await fetch(buildUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  });
}

// Call the function to execute the HTTP POST calls
generateTestPDFs();
