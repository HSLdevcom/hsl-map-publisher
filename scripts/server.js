const orderBy = require('lodash/orderBy');
const get = require('lodash/get');
const Koa = require('koa');
const session = require('koa-session');
const Router = require('koa-router');
const cors = require('@koa/cors');
const jsonBody = require('koa-json-body');
const fs = require('fs-extra');
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const fileHandler = require('./fileHandler');
const authEndpoints = require('./auth/authEndpoints');
const { matchStopDataToRules } = require('./util/rules');

const {
  DOMAINS_ALLOWED_TO_GENERATE,
  PUBLISHER_TEST_GROUP,
  REDIS_CONNECTION_STRING,
} = require('../constants');

const {
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
  getTemplates,
  addTemplate,
  saveTemplate,
  getImages,
  removeImage,
  removeTemplate,
  getTemplate,
  getStopInfo,
} = require('./store');

const { downloadPostersFromCloud } = require('./cloudService');

const PORT = 4000;

const bullRedisConnection = new Redis(REDIS_CONNECTION_STRING, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
const queue = new Queue('publisher', { connection: bullRedisConnection });

const cancelSignalRedis = new Redis(REDIS_CONNECTION_STRING);

async function generatePoster(buildId, component, props, index) {
  const { stopId, date, template, selectedRuleTemplates } = props;

  // RuleTemplates are not available for TerminalPoster
  const data = component !== 'TerminalPoster' ? await getStopInfo({ stopId, date }) : null;

  // Checks if any rule template will match the stop, and returns *the first one*.
  // If no match, returns the default template.
  /* eslint-disable no-await-in-loop */
  const selectTemplate = async () => {
    for (const t of selectedRuleTemplates) {
      const tData = await getTemplate({ id: t }, false);
      if (tData && matchStopDataToRules(tData.rules, data)) return t;
    }
    return template;
  };
  /* eslint-enable no-await-in-loop */

  const chosenTemplate = await selectTemplate();
  const renderProps = { ...props };
  delete renderProps.template;
  delete renderProps.selectedRuleTemplates;

  const { id } = await addPoster({
    buildId,
    component,
    template: chosenTemplate,
    props,
    order: index,
  });

  const options = {
    id,
    component,
    props: renderProps,
    template: chosenTemplate,
  };

  queue.add('generate', { options }, { jobId: id });

  return { id };
}

const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.status = error.status || 500;
    ctx.body = { message: error.message };
    if (ctx.status !== 401) {
      console.error(error); // eslint-disable-line no-console
    }
  }
};

const authMiddleware = async (ctx, next) => {
  // Helper function to allow specific requests without authentication
  const allowAuthException = ctx2 => {
    // Allow session related requests
    if (['/login', '/logout', '/session'].includes(ctx2.path)) {
      return true;
    }
    // Allow GET localhost:4000/templates/..., so that puppeteer can get the template.
    if (
      ctx2.path.startsWith('/templates/') &&
      ctx.method === 'GET' &&
      ctx.host === 'localhost:4000'
    ) {
      return true;
    }
    return false;
  };

  if (allowAuthException(ctx)) {
    // Do not check the authentication beforehands for session related paths.
    await next();
  } else {
    const authResponse = await authEndpoints.checkExistingSession(
      ctx.request,
      ctx.response,
      ctx.session,
    );

    if (!authResponse.body.isOk) {
      // Not authenticated, throw 401
      ctx.throw(401);
    } else {
      await next();
    }
  }
};

const allowedToGenerate = user => {
  if (!user || !user.email) return false;
  const domain = user.email.split('@')[1];
  const parsedAllowedDomains = DOMAINS_ALLOWED_TO_GENERATE.split(',');
  if (user.groups && user.groups.includes(PUBLISHER_TEST_GROUP)) {
    return true;
  }

  return parsedAllowedDomains.includes(domain);
};

async function main() {
  await migrate();

  const app = new Koa();
  const router = new Router();

  router.get('/images', async ctx => {
    ctx.body = await getImages();
  });

  router.delete('/images/:name', async ctx => {
    const { name } = ctx.params;
    const image = await removeImage({ name });
    ctx.body = image;
  });

  router.get('/templates', async ctx => {
    ctx.body = await getTemplates();
  });

  router.get('/templates/:id', async ctx => {
    const { id } = ctx.params;
    ctx.body = await getTemplate({ id });
  });

  router.post('/templates', async ctx => {
    const { label } = ctx.request.body;
    const template = await addTemplate({ label });
    ctx.body = template;
  });

  router.put('/templates', async ctx => {
    const template = ctx.request.body;
    await saveTemplate(template);
    ctx.body = true;
  });

  router.delete('/templates/:id', async ctx => {
    const { id } = ctx.params;
    const template = await removeTemplate({ id });
    ctx.body = template;
  });

  router.get('/builds', async ctx => {
    const builds = await getBuilds();
    ctx.body = builds;
  });

  router.get('/builds/:id', async ctx => {
    const { id } = ctx.params;
    const builds = await getBuild({ id });
    ctx.body = builds;
  });

  router.post('/builds', async ctx => {
    const { title } = ctx.request.body;
    const build = await addBuild({ title });
    ctx.body = build;
  });

  router.put('/builds/:id', async ctx => {
    const { id } = ctx.params;
    const { status } = ctx.request.body;
    const build = await updateBuild({
      id,
      status,
    });
    ctx.body = build;
  });

  router.delete('/builds/:id', async ctx => {
    const { id } = ctx.params;
    const build = await removeBuild({ id });
    ctx.body = build;
  });

  router.get('/posters/:id', async ctx => {
    const { id } = ctx.params;
    const poster = await getPoster({ id });
    ctx.body = poster;
  });

  router.post('/posters', async ctx => {
    const { buildId, component, props } = ctx.request.body;
    const build = await getBuild({ id: buildId });
    const posters = [];

    const authResponse = await authEndpoints.checkExistingSession(
      ctx.request,
      ctx.response,
      ctx.session,
    );

    for (let i = 0; i < props.length; i++) {
      const currentProps = props[i];
      const user = authResponse.body;
      const isAllowedUser = allowedToGenerate(user);
      if (!isAllowedUser) {
        ctx.throw(401, `Generointi epäonnistui.`);
      }
      let orderNumber = get(
        build.posters.find(
          poster => poster.props.stopId === currentProps.stopId && poster.status === 'FAILED',
        ),
        'order',
        null,
      );
      if (!orderNumber) orderNumber = i + build.posters.length;
      posters.push(generatePoster(buildId, component, currentProps, orderNumber));
    }

    try {
      ctx.body = await Promise.all(posters);
    } catch (err) {
      ctx.throw(500, err.message || 'Poster generation failed.');
    }
  });

  router.delete('/posters/:id', async ctx => {
    const { id } = ctx.params;
    const poster = await removePoster({ id });
    ctx.body = poster;
  });

  router.post('/cancelPoster', async ctx => {
    const { item } = ctx.request.body;
    const jobId = item.id;
    const poster = await updatePoster({ id: jobId, status: 'FAILED' });
    const success = await queue.remove(jobId);
    if (!success) {
      cancelSignalRedis.publish('cancel', jobId);
    }

    ctx.body = poster;
  });

  router.get('/downloadPoster/:id', async ctx => {
    const { id } = ctx.params;
    const { component } = await getPoster({ id });
    let filename;

    const downloadedPosterIds = await downloadPostersFromCloud([id]);
    if (downloadedPosterIds.length < 1) {
      ctx.throw(404, 'Poster ids not found.');
    }
    try {
      filename = await fileHandler.concatenate(downloadedPosterIds, `${component}-${id}`);
      await fileHandler.removeFiles(downloadedPosterIds);
    } catch (err) {
      ctx.throw(500, err.message || 'PDF concatenation failed.');
    }

    console.log('PDF concatenation succeeded.');

    ctx.type = 'application/pdf';
    ctx.set('Content-Disposition', `attachment; filename="${component}-${id}.pdf"`);
    ctx.body = fs.createReadStream(filename);

    await fs.remove(filename);
  });

  router.get('/downloadBuild/:id', async ctx => {
    const { id } = ctx.params;
    const { first, last } = ctx.query;
    const { title, posters } = await getBuild({ id });
    const parsedTitle = first && last ? `${title}-${parseInt(first, 10) + 1}-${last}` : title;
    let filename;
    let orderedPosters = posters.sort((a, b) => (a.order > b.order ? 1 : -1));
    const slicedPosters = orderedPosters.slice(first, last);
    const posterIds = slicedPosters
      .filter(poster => poster.status === 'READY')
      .map(poster => poster.id);
    const downloadedPosterIds = await downloadPostersFromCloud(posterIds);

    if (downloadedPosterIds.length < 1) {
      ctx.throw(404, 'Poster ids not found.');
    }

    try {
      // Get the order of the downloaded posters and sort the posters before concatenation.
      orderedPosters = orderBy(
        downloadedPosterIds.map(downloadedId => ({
          id: downloadedId,
          order: get(
            posters.find(({ id: posterId }) => posterId === downloadedId),
            'order',
            0,
          ),
        })),
        'order',
        'asc',
      );

      filename = await fileHandler.concatenate(
        orderedPosters.map(poster => poster.id),
        parsedTitle,
      );
      await fileHandler.removeFiles(downloadedPosterIds);
    } catch (err) {
      ctx.throw(500, err.message || 'PDF concatenation failed.');
    }

    ctx.type = 'application/pdf';
    ctx.set('Content-Disposition', `attachment; filename="${parsedTitle}-${id}.pdf"`);
    ctx.body = fs.createReadStream(filename);

    await fs.remove(filename);
  });

  router.post('/login', async ctx => {
    const authResponse = await authEndpoints.authorize(ctx.request, ctx.response, ctx.session);
    ctx.session = authResponse.modifiedSession;
    ctx.body = authResponse.body;
    ctx.response.status = authResponse.status;
  });

  router.get('/logout', async ctx => {
    const authResponse = await authEndpoints.logout(ctx.request, ctx.response, ctx.session);
    ctx.session = null;
    ctx.response.status = authResponse.status;
  });

  router.get('/session', async ctx => {
    const authResponse = await authEndpoints.checkExistingSession(
      ctx.request,
      ctx.response,
      ctx.session,
    );
    ctx.body = authResponse.body;
    ctx.response.status = authResponse.status;
  });

  app.keys = ['secret key'];

  const CONFIG = {
    renew: true,
    maxAge: 86400000 * 30,
  };

  app.use(session(CONFIG, app));

  app
    .use(errorHandler)
    .use(
      cors({
        credentials: true,
      }),
    )
    .use(authMiddleware)
    .use(jsonBody({ fallback: true, limit: '10mb' }))
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(PORT, () => console.log(`Listening at ${PORT}`)); // eslint-disable-line no-console
}

main().catch(error => console.error(error.stack)); // eslint-disable-line no-console
