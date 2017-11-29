const Koa = require("koa");
const Router = require("koa-router");
const cors = require("@koa/cors");
const jsonBody = require("koa-json-body");

const fetchStops = require("./stops");
const generator = require("./generator");
const {
    migrate, getBuilds, addBuild, addPoster, addEvent, updatePoster,
} = require("./store");

const PORT = 4000;

async function generatePoster(buildId, component, props) {
    const { id } = await addPoster({ buildId, component, props });

    const onInfo = (message) => {
        console.log(`${id}: ${message}`); // eslint-disable-line no-console
        addEvent({ posterId: id, type: "INFO", message });
    };
    const onError = (error) => {
        console.error(`${id}: ${error.message} ${error.stack}`); // eslint-disable-line no-console
        addEvent({ posterId: id, type: "ERROR", message: error.message });
    };

    const options = {
        id, component, props, onInfo, onError,
    };

    generator.generate(options)
        .then(({ success }) => updatePoster({ id, status: success ? "READY" : "FAILED" }))
        .catch(error => console.error(error)); // eslint-disable-line no-console

    return { id };
}

const errorHandler = async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        ctx.status = 500;
        ctx.body = { message: error.message };
        console.error(error); // eslint-disable-line no-console
    }
};

async function main() {
    await migrate();

    const app = new Koa();
    const router = new Router();

    // FIXME: Update UI to fetch from graphql and remove when data available
    const stops = await fetchStops();
    router.get("/stops", (ctx) => {
        ctx.body = stops;
    });

    router.get("/builds", async (ctx) => {
        const builds = await getBuilds();
        ctx.body = builds;
    });

    router.post("/builds", async (ctx) => {
        const { title } = ctx.request.body;
        const build = await addBuild({ title });
        ctx.body = build;
    });

    router.post("/posters", async (ctx) => {
        const { buildId, component, props } = ctx.request.body;
        const posters = [];
        for (let i = 0; i < props.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            posters.push(await generatePoster(buildId, component, props[i]));
        }
        ctx.body = posters;
    });

    app
        .use(errorHandler)
        .use(cors())
        .use(jsonBody({ fallback: true }))
        .use(router.routes())
        .use(router.allowedMethods())
        .listen(PORT, () => console.log(`Listening at ${PORT}`)); // eslint-disable-line no-console
}

main().catch(error => console.error(error)); // eslint-disable-line no-console
