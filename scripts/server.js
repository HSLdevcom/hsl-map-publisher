const fs = require("fs");
const path = require("path");

const Koa = require("koa");
const Router = require("koa-router");
const cors = require("@koa/cors");
const jsonBody = require("koa-json-body");

const moment = require("moment");
const { spawn } = require("child_process");

const fetchStops = require("./stops");
const generator = require("./generator");
const Logger = require("./logger");

// 5 * 72 = 360 dpi
const SCALE = 5;

const PORT = 4000;

const OUTPUT_PATH = path.join(__dirname, "..", "output");

let queueLength = 0;

function generatePdf(directory, filenames, outputFilename) {
    const outputPath = path.join(directory, outputFilename.replace(/(\/|\\)/g, ""));
    return new Promise((resolve, reject) => {
        const pdftk = spawn("pdftk", [
            ...filenames,
            "cat",
            "output",
            outputPath,
        ]);
        pdftk.stderr.on("data", data => reject(new Error(data.toString())));
        pdftk.on("close", resolve);
    });
}

function generateFiles(component, props, outputFilename = "output.pdf") {
    const identifier = moment().format("YYYY-MM-DD-HHmm-sSSSSS");
    const directory = path.join(OUTPUT_PATH, identifier);

    fs.mkdirSync(directory);
    const logger = new Logger(path.join(directory, "build.log"));

    const promises = [];
    for (let i = 0; i < props.length; i++) {
        const filename = `${i + 1}.pdf`;
        const options = {
            logger,
            filename,
            directory,
            component,
            props: props[i],
            scale: SCALE,
        };

        queueLength++;

        promises.push(generator.generate(options)
            .then((success) => { // eslint-disable-line no-loop-func
                queueLength--;
                return success && path.join(directory, filename);
            }));
    }

    Promise.all(promises)
        .then((filenames) => {
            const validFilenames = filenames.filter(name => !!name);
            logger.logInfo(`Successfully rendered ${validFilenames.length} / ${filenames.length} pages\n`);
            return generatePdf(directory, validFilenames, outputFilename);
        })
        .then(() => {
            logger.end("DONE");
        })
        .catch((error) => {
            logger.logError(error);
            logger.end("FAIL");
        });

    return identifier;
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

    router.get("/queueInfo", (ctx) => {
        successResponse(ctx, { queueLength });
    });

    router.post("/generate", (ctx) => {
        const { component, props, filename } = ctx.request.body;

        if (typeof component !== "string" || !(props instanceof Array) || !props.length) {
            return errorResponse(ctx, new Error("Invalid request body"));
        }

        try {
            const filePath = generateFiles(component, props, filename);
            return successResponse(ctx, { path: filePath });
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
