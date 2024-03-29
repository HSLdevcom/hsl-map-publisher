const uuidv1 = require('uuid/v1');
const camelCase = require('lodash/camelCase');
const snakeCase = require('lodash/snakeCase');
const pMap = require('p-map');
const merge = require('lodash/merge');
const get = require('lodash/get');
const flatMap = require('lodash/flatMap');
const fetch = require('node-fetch');

const config = require('../knexfile');
// eslint-disable-next-line import/order
const knex = require('knex')(config);
const createEmptyTemplate = require('./util/createEmptyTemplate');
const cleanup = require('./util/cleanup');

const { JORE_GRAPHQL_URL } = require('../constants');

// Must cleanup knex, otherwise the process keeps going.
cleanup(() => {
  knex.destroy();
});

function convertKeys(object, converter) {
  const obj = {};
  Object.keys(object).forEach(key => {
    obj[converter(key)] = object[key];
  });
  return obj;
}

async function migrate() {
  await knex.migrate.latest();
}

async function getBuilds() {
  const rows = await knex
    .select(
      'build.*',
      knex.raw("count(case when poster.status = 'PENDING' then 1 end)::integer as pending"),
      knex.raw("count(case when poster.status = 'FAILED' then 1 end)::integer as failed"),
      knex.raw("count(case when poster.status = 'READY' then 1 end)::integer as ready"),
    )
    .from('build')
    .whereNot('build.status', 'REMOVED')
    .leftJoin('poster', 'build.id', 'poster.build_id')
    .orderBy('build.created_at', 'desc')
    .groupBy('build.id');

  return rows.map(row => convertKeys(row, camelCase));
}

async function getBuild({ id }) {
  const buildRow = await knex
    .select('*')
    .from('build')
    .whereNot('build.status', 'REMOVED')
    .andWhere('build.id', id)
    .first();

  if (!buildRow) {
    const error = new Error(`Build ${id} not found`);
    error.status = 404;
    throw error;
  }

  const posterRows = await knex
    .select(
      'poster.id',
      'poster.status',
      'poster.component',
      'poster.props',
      'poster.created_at',
      'poster.updated_at',
      'poster.order',
      knex.raw(`json_agg(
                json_build_object(
                    'type', event.type,
                    'message', event.message,
                    'createdAt', event.created_at
                ) order by event.created_at
            ) as events`),
    )
    .from('poster')
    .whereNot('poster.status', 'REMOVED')
    .andWhere('poster.build_id', id)
    .leftJoin('event', 'event.poster_id', 'poster.id')
    .groupBy('poster.id');

  const build = convertKeys(buildRow, camelCase);
  const posters = posterRows.map(row => convertKeys(row, camelCase));
  return Object.assign({}, build, { posters });
}

async function addBuild({ title }) {
  const id = uuidv1();
  await knex('build').insert({
    id,
    title,
  });
  return { id };
}

async function updateBuild({ id, status }) {
  await knex('build')
    .where({ id })
    .update({ status, updated_at: knex.fn.now() });
  return { id };
}

async function removeBuild({ id }) {
  await knex('build')
    .where({ id })
    .update({ status: 'REMOVED', updated_at: knex.fn.now() });
  return { id };
}

async function getPoster({ id }) {
  const row = await knex
    .select('*')
    .from('poster')
    .whereNot('poster.status', 'REMOVED')
    .andWhere('poster.id', id)
    .first();

  if (!row) {
    const error = new Error(`Poster ${id} not found`);
    error.status = 404;
    throw error;
  }
  return convertKeys(row, camelCase);
}

async function addPoster({ buildId, component, template, props, order }) {
  const id = uuidv1();
  await knex('poster').insert({
    ...convertKeys(
      {
        id,
        buildId,
        component,
        template,
        props,
      },
      snakeCase,
    ),
    order,
  });
  await knex('build')
    .where('id', buildId)
    .update({ updated_at: knex.fn.now() });

  return { id };
}

async function updatePoster({ id, status }) {
  await knex('poster')
    .where({ id })
    .update({ status, updated_at: knex.fn.now() });
  return { id };
}

async function removePoster({ id }) {
  const buildId = await knex('poster')
    .returning('build_id')
    .where({ id })
    .update({ status: 'REMOVED', updated_at: knex.fn.now() });
  await knex('build')
    .where('id', buildId[0].build_id)
    .update({ updated_at: knex.fn.now() });
  return { id };
}

async function addEvent({ posterId = null, buildId = null, type, message }) {
  const msg = !message ? 'No message.' : message;
  await knex('event').insert(
    convertKeys(
      {
        posterId,
        buildId,
        type,
        message: msg,
      },
      snakeCase,
    ),
  );
}

async function getTemplateImage(slot) {
  const emptySlot = {
    image: null,
    size: get(slot, 'size', 1),
  };

  const imageName = get(slot, 'image.name', '');

  if (!imageName) {
    return emptySlot;
  }

  const dbImg = await knex
    .select('*')
    .from('template_images')
    .where({ name: imageName })
    .first();

  if (dbImg) {
    return merge({}, slot, { image: dbImg });
  }

  return emptySlot;
}

async function getTemplateImages(template) {
  if (!template) {
    return template;
  }

  return merge({}, template, {
    areas: await pMap(template.areas, async area =>
      merge({}, area, {
        slots: await pMap(area.slots, slot => getTemplateImage(slot)),
      }),
    ),
  });
}

async function getTemplates() {
  const templates = await knex('template')
    .select('*')
    .orderBy('created_at', 'asc');
  return pMap(templates, template => getTemplateImages(template));
}

async function addTemplate({ label }) {
  const templateId = snakeCase(label);
  const template = createEmptyTemplate(label, templateId);

  await knex('template').insert(template);

  return template;
}

async function getTemplate({ id }, withImages = true) {
  const templateRow = await knex
    .select('*')
    .from('template')
    .where({ id })
    .first();

  if (!withImages) {
    return templateRow;
  }

  return getTemplateImages(templateRow);
}

// Not exported. Saves the passed images into the database.
async function saveAreaImages(slots) {
  return pMap(slots, async slot => {
    if (!slot.image) {
      return slot;
    }

    const imageName = get(slot, 'image.name', '');

    const existingImage = await knex
      .select('*')
      .from('template_images')
      .where({ name: imageName })
      .first();

    const svgContent = get(slot, 'image.svg', '');

    if (svgContent) {
      const newImage = {
        name: imageName,
        svg: svgContent,
        default_size: slot.size,
      };

      if (existingImage) {
        await knex('template_images')
          .where({ name: imageName })
          .update({ ...newImage, updated_at: knex.fn.now() });
      } else {
        await knex('template_images').insert(newImage);
      }
    }

    // eslint-disable-next-line no-param-reassign
    slot.image = { name: imageName };
    return slot;
  });
}

async function saveTemplate(template) {
  const { id } = template;
  const existingTemplate = await getTemplate({ id }, false);

  const savedAreas = await pMap(template.areas, async area =>
    merge({}, area, {
      slots: await saveAreaImages(area.slots),
    }),
  );

  const newTemplate = merge({}, template, {
    areas: JSON.stringify(savedAreas),
  });

  if (existingTemplate) {
    await knex('template')
      .where({ id })
      .update({ ...newTemplate, updated_at: knex.fn.now() });
  } else {
    await knex('template').insert(template);
  }

  return newTemplate;
}

async function removeTemplate({ id }) {
  if (/default/.test(id)) {
    const error = new Error('You cannot remove the default template.');
    error.status = 400;
    throw error;
  }

  await knex('template')
    .where({ id })
    .del();

  return { id };
}

async function getImages() {
  return knex('template_images')
    .select('*')
    .orderBy('updated_at', 'asc');
}

function templateHasImage(template, imageName) {
  return template.areas.some(area =>
    area.slots.some(slot => get(slot, 'image.name', '_') === imageName),
  );
}

async function removeImage({ name }) {
  const templates = await knex('template').select('*');

  if (templates.some(template => templateHasImage(template, name))) {
    const error = new Error(`Image '${name}' is in use in one or more templates!`);
    error.status = 400;
    throw error;
  }

  await knex('template_images')
    .where({ name })
    .del();

  return { name };
}

async function getStopInfo({ stopId, date }) {
  const query = `
    query stopInfoQuery($stopId: String!, $date: Date!) {
      stop: stopByStopId(stopId: $stopId) {
        shortId
        stopZone
        siblings {
          nodes {
            routeSegments: routeSegmentsForDate(date: $date) {
              nodes {
                routeId
                hasRegularDayDepartures(date: $date)
                pickupDropoffType
                route {
                  nodes {
                    mode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(JORE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables: { stopId, date } }),
  });

  const stopData = await response.json();
  const { stop } = stopData.data;

  const routeSegments = flatMap(stop.siblings.nodes, node => node.routeSegments.nodes);
  const routeIds = routeSegments.map(routeSegment => routeSegment.routeId);
  const modes = flatMap(routeSegments, node => node.route.nodes.map(route => route.mode));
  const city = stop.shortId.match(/^[a-zA-Z]*/)[0]; // Get the first letters of the id.
  const { stopZone } = stop;

  return {
    routeIds,
    modes,
    city,
    stopZone,
  };
}

module.exports = {
  migrate,
  getBuilds,
  getBuild,
  addBuild,
  updateBuild,
  removeBuild,
  getPoster,
  addPoster,
  updatePoster,
  removePoster,
  addEvent,
  getTemplates,
  getTemplate,
  addTemplate,
  saveTemplate,
  removeTemplate,
  getImages,
  removeImage,
  getStopInfo,
};
