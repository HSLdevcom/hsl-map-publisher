const fs = require("fs");
const path = require("path");

const Koa = require("koa");
const Router = require("koa-router");
const cors = require("@koa/cors");
const jsonBody = require("koa-json-body");

const moment = require("moment");
const iconv = require("iconv-lite");
const csv = require("csv");
const fetch = require("node-fetch");
const spawn = require("child_process").spawn;

const generator = require("./generator");
const Logger = require("./logger");

// 5 * 72 = 360 dpi
const SCALE = 5;

const PORT = 4000;

const OUTPUT_PATH = path.join(__dirname, "..", "output");

const API_URL = "http://kartat.hsl.fi/jore/graphql";

let queueLength = 0;

function fetchStopIds() {
    const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "query AllStops {allStops { nodes { stopId}} }" }),
    };

    return fetch(API_URL, options)
        .then(response => response.json())
        .then(json => json.data.allStops.nodes.map(stop => stop.stopId));
}


// FIXME: Fetch stops from graphql when data available
function fetchStops() {
    return new Promise((resolve, reject) => {
        fs.createReadStream(`${__dirname}/jr_map_pysakit_varustus.txt`)
            .pipe(iconv.decodeStream("ISO-8859-1"))
            .pipe(csv.parse({ delimiter: "#", columns: true }, (err, data) => {
                if (err) reject(err);
                const stops = data
                    .map(stop => ({
                        stopId: stop.tunnus,
                        shortId: stop.lyhyt_nro,
                        nameFi: stop.nimi_suomi,
                        group: `${stop.aikataulutyyppi_hsl}${stop.aikataulutyyppi_hkl}`,
                        index: stop.ajojarjestys,
                        hasShelter: stop.pysakkityyppi.includes("katos") &&
                            !(stop.lyhyt_nro.startsWith("Ki")
                                && stop.pysakkityyppi.includes("teräskatos")),
                    }))
                    .sort((a, b) => a.shortId.localeCompare(b.shortId));
                resolve(stops);
            })
        );
    });
}

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

        promises.push(
            generator.generate(options)
                .then((success) => { // eslint-disable-line no-loop-func
                    queueLength--;
                    return success && path.join(directory, filename);
                })
        );
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
    console.error(error);
    console.error(error.stack);
}

async function main() {
    let stops = await fetchStops();
    const stopIds = await fetchStopIds();
    stops = stops.filter(stop => stopIds.includes(stop.stopId));

    const app = new Koa();
    const router = new Router();

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
            if (err) {
                console.error(err);
            }
            console.log(`Listening at port ${PORT}`);
        });
}

main().catch(console.log.bind(console));
