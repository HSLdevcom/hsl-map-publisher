const Koa = require("koa");
const Router = require("koa-router");
const cors = require("@koa/cors");
const jsonBody = require("koa-json-body");

const fetchStops = require("./stops");
const generator = require("./generator");

const PORT = 4000;

async function generatePosters(component, propsArray) {
    for (let i = 0; i < propsArray.length; i++) {
        const props = propsArray[i];
        const id = Date.now();
        const onInfo = message => console.log(message);
        const onError = error => console.error(error);

        const options = {
            id, component, props, onInfo, onError,
        };

        generator.generate(options)
            .then(({ status, filename }) => console.log(filename))
            .catch(error => console.eror(error)); // eslint-disable-line no-console
    }
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
    const app = new Koa();
    const router = new Router();

    // FIXME: Update UI to fetch from graphql and remove when data available
    const stops = await fetchStops();
    router.get("/stops", (ctx) => {
        successResponse(ctx, stops);
    });

    router.post("/generate", async (ctx) => {
        const { component, props } = ctx.request.body;

        if (typeof component !== "string" || !(props instanceof Array) || !props.length) {
            return errorResponse(ctx, new Error("Invalid request body"));
        }

        try {
            await generatePosters(component, props);
            return successResponse(ctx, { success: true });
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
