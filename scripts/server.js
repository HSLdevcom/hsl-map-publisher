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

function successResponse(ctx, body, type = "application/json") {
    ctx.status = 200;
    ctx.type = type;
    ctx.body = body;
}

function errorResponse(ctx, error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
    console.error(error); // eslint-disable-line no-console
    console.error(error.stack); // eslint-disable-line no-console
}

async function main() {
    await migrate();

    const app = new Koa();
    const router = new Router();

    // FIXME: Update UI to fetch from graphql and remove when data available
    const stops = await fetchStops();
    router.get("/stops", (ctx) => {
        successResponse(ctx, stops);
    });

    router.get("/builds", async (ctx) => {
        try {
            const builds = await getBuilds();
            return successResponse(ctx, builds);
        } catch (error) {
            return errorResponse(ctx, error);
        }
    });

    router.post("/builds", async (ctx) => {
        const { title } = ctx.request.body;

        try {
            const build = await addBuild({ title });
            return successResponse(ctx, build);
        } catch (error) {
            return errorResponse(ctx, error);
        }
    });

    router.post("/posters", async (ctx) => {
        const { buildId, component, props } = ctx.request.body;

        try {
            const posters = [];
            for (let i = 0; i < props.length; i++) {
                // eslint-disable-next-line no-await-in-loop
                posters.push(await generatePoster(buildId, component, props[i]));
            }
            return successResponse(ctx, posters);
        } catch (error) {
            return errorResponse(ctx, error);
        }
    });

    app
        .use(cors())
        .use(jsonBody({ fallback: true }))
        .use(router.routes())
        .use(router.allowedMethods())
        .listen(PORT, (err) => {
            if (err) console.error(err); // eslint-disable-line no-console
            console.log(`Listening at port ${PORT}`); // eslint-disable-line no-console
        });
}

main().catch(console.log.bind(console)); // eslint-disable-line no-console
