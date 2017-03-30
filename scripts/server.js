const path = require("path");
const fs = require("fs");

const Koa = require("koa");
const Router = require("koa-router");
const body = require("koa-json-body");
const serveList = require("koa-serve-list");
const serveStatic = require("koa-static");

const moment = require("moment");
const fetch = require("node-fetch");
const csv = require("csv");

const generator = require("./pdfGenerator");

const PORT = 4000;
const API_URL = "http://kartat.hsl.fi";
const OUTPUT_PATH = path.join(__dirname, "..", "output");


function fetchStopIds() {
    return fetch(`${API_URL}/stopIds`).then(response => response.json());
}

function fetchStopsWithShelter() {
    return new Promise(resolve => (
        fs.createReadStream(`${__dirname}/jr_map_pysakit_varustus.txt`).pipe(
            csv.parse({ delimiter: "#", columns: true }, (err, data) => {
                resolve(data.filter(row => row.pysakkityyppi.includes("katos"))
                    .map(row => row.tunnus));
            })
        )
    ));
}

function generateFiles(generate, component, options) {
    const identifier = moment().format("YYYY-MM-DD-HHmm-");
    const basePath = path.join(OUTPUT_PATH, identifier);

    fs.mkdirSync(basePath);

    for (let i = 0; i < options.length; i++) {
        generate(component, options[i], basePath, `${i + 1}.png`);
    }
    return identifier;
}

function successResponse(ctx, body) {
    ctx.status = 200;
    ctx.body = body;
}

function errorResponse(ctx, error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
    console.log(error);
    console.log(error.stack);
}

async function main() {
    const generate = await generator();

    const app = new Koa();
    const router = new Router();

    router.post("/", (ctx) => {
        const { component, options } = ctx.request.body;

        if (!component || !options || !options instanceof Array) {
            return errorResponse(ctx, new Error("Invalid request body"));
        }

        try {
            const path = generateFiles(generate, component, options);
            successResponse(ctx, { path });
        } catch (error) {
            errorResponse(ctx, error);
        }
    });

    app
        .use(body({ fallback: true }))
        .use(router.routes())
        .use(router.allowedMethods())
        .use(serveStatic(OUTPUT_PATH))
        .use(serveList(OUTPUT_PATH, { icons: true }))
        .listen(PORT, (err) => {
            if (err) {
                console.error(err);
            }
            console.log(`Listening at port ${PORT}`);
        });
}

main().catch(console.log.bind(console));
