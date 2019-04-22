const Koa = require('koa');
const session = require('koa-session');
const Router = require('koa-router');
const cors = require('@koa/cors');
const jsonBody = require('koa-json-body');

const generator = require('./generator');
const authEndpoints = require('./auth/authEndpoints');

const {
  migrate,
  addEvent,
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
} = require('./store');

const PORT = 4000;

async function generatePoster(buildId, component, template, props) {
  const { id } = await addPoster({
    buildId,
    component,
    template,
    props,
  });

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

  const options = {
    id,
    component,
    props,
    template,
    onInfo,
    onError,
  };
  generator
    .generate(options)
    .then(({ success }) =>
      updatePoster({
        id,
        status: success ? 'READY' : 'FAILED',
      }),
    )
    .catch(error => console.error(error)); // eslint-disable-line no-console

  return { id };
}

const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    ctx.status = error.status || 500;
    ctx.body = { message: error.message };
    console.error(error); // eslint-disable-line no-console
  }
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
    const { buildId, component, props, template } = ctx.request.body;
    const posters = [];
    for (let i = 0; i < props.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      posters.push(await generatePoster(buildId, component, template, props[i]));
    }
    ctx.body = posters;
  });

  router.delete('/posters/:id', async ctx => {
    const { id } = ctx.params;
    const poster = await removePoster({ id });
    ctx.body = poster;
  });

  router.get('/downloadBuild/:id', async ctx => {
    const { id } = ctx.params;
    const { title, posters } = await getBuild({ id });
    const posterIds = posters.filter(poster => poster.status === 'READY').map(poster => poster.id);
    ctx.type = 'application/pdf';
    ctx.set('Content-Disposition', `attachment; filename="${title}-${id}.pdf"`);
    ctx.body = generator.concatenate(posterIds);
  });

  router.get('/downloadPoster/:id', async ctx => {
    const { id } = ctx.params;
    const { component } = await getPoster({ id });
    ctx.type = 'application/pdf';
    ctx.set('Content-Disposition', `attachment; filename="${component}-${id}.pdf"`);
    ctx.body = generator.concatenate([id]);
  });

  router.post('/login', async ctx => {
    const authResponse = await authEndpoints.authorize(ctx.request, ctx.response, ctx.session);
    ctx.body = authResponse.body;
    ctx.response.status = authResponse.status;
  });

  router.get('/logout', async ctx => {
    const authResponse = await authEndpoints.logout(ctx.request, ctx.response, ctx.session);
    ctx.session = null;
    ctx.response.status = authResponse.status;
  });

  router.get('/session', async ctx => {
    const authResponse = await authEndpoints.checkExistingSession(ctx.request, ctx.response, ctx.session);
    ctx.body = authResponse.body;
    ctx.response.status = authResponse.status;
  });

  app.keys = ['secret key'];

  app.use(session(app));

  app
    .use(errorHandler)
    .use(cors({
      credentials: true,
    }))
    .use(jsonBody({ fallback: true, limit: '10mb' }))
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(PORT, () => console.log(`Listening at ${PORT}`)); // eslint-disable-line no-console
}

main().catch(error => console.error(error.stack)); // eslint-disable-line no-console
