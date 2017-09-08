const fs = require("fs");
const path = require("path");

const Koa = require("koa");
const Router = require("koa-router");
const jsonBody = require("koa-json-body");

const moment = require("moment");
const iconv = require("iconv-lite");
const csv = require("csv");
const fetch = require("node-fetch");
const spawn = require("child_process").spawn;
const promisify = require("util").promisify;

const generator = require("./generator");
const Logger = require("./logger");
const JsonLogger = require("./jsonLogger");

const unlinkAsync = promisify(fs.unlink);
const readDirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);

// 5 * 72 = 360 dpi
const SCALE = 5;
const PDF_PPI = 72;

const PORT = 4000;

const OUTPUT_PATH = path.join(__dirname, "..", "output");
const API_URL = "http://kartat.hsl.fi/jore/graphql";

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

function spawnAsync(cmd, args) {
    return new Promise((resolve, reject) => {
        const childProcess = spawn(cmd, args);
        childProcess.stderr.on("data", data => reject(new Error(data.toString())));
        childProcess.on("close", () => resolve());
    });
}

async function generatePdf(directory, filenames, outputFilename) {
    const inputPaths = filenames.map(filename => path.join(directory, filename));
    const outputFilenameSanitized = outputFilename.replace(/(\/|\\)/g, "");
    const outputPath = path.join(directory, outputFilenameSanitized);

    await spawnAsync("pdftk", [...inputPaths, "cat", "output", outputPath]);
    return outputFilenameSanitized;
}

async function convertToCmykPdf(directory, filename) {
    const cmykFilename = filename.replace(".tiff", ".cmyk.tiff");
    const pdfFilename = filename.replace(".tiff", ".pdf");
    const sourcePath = path.join(directory, filename);
    const cmykPath = path.join(directory, cmykFilename);
    const pdfPath = path.join(directory, pdfFilename);

    await spawnAsync("cctiff", ["rgb_to_cmyk.icc", sourcePath, cmykPath]);
    await unlinkAsync(sourcePath);
    await spawnAsync("convert", [
        "-density", SCALE * PDF_PPI,
        "-units", "PixelsPerInch",
        cmykPath, pdfPath,
    ]);
    await unlinkAsync(cmykPath);

    return pdfFilename;
}

function generateFiles(component, props, outputFilename = "output.pdf") {
    const identifier = moment().format("YYYY-MM-DD-HHmm-sSSSSS");
    const directory = path.join(OUTPUT_PATH, identifier);

    fs.mkdirSync(directory);
    const logger = new Logger(path.join(directory, "build.log"));
    const jsonLogger = new JsonLogger({
        path: path.join(directory, "build.json"),
        pageCount: props.length,
    });

    const promises = [];
    for (let i = 0; i < props.length; i++) {
        const filename = `${i + 1}.tiff`;
        const options = {
            logger,
            component,
            directory,
            filename,
            props: props[i],
            scale: SCALE,
        };

        promises.push(
            generator.generate(options)
                .then((success) => { // eslint-disable-line no-loop-func
                    if (!success) return null;
                    return convertToCmykPdf(directory, filename);
                })
                .then((pdfFilename) => {
                    jsonLogger.logPage({ component, props: props[i], filename: pdfFilename });
                    return pdfFilename;
                })
                .catch((error) => {
                    logger.logError(error);
                    jsonLogger.logPage({ component, props: props[i], filename: null });
                })
        );
    }

    Promise.all(promises)
        .then((filenames) => {
            const validFilenames = filenames.filter(name => !!name);
            logger.logInfo(`Successfully rendered ${validFilenames.length} / ${filenames.length} pages\n`);
            return generatePdf(directory, validFilenames, outputFilename);
        })
        .then((filename) => {
            jsonLogger.logSuccess({ filename });
            logger.end("DONE");
        })
        .catch((error) => {
            jsonLogger.logError(error);
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
    let stops = await fetchStops();
    const stopIds = await fetchStopIds();
    stops = stops.filter(stop => stopIds.includes(stop.stopId));

    const app = new Koa();
    const router = new Router();

    router.get("/stops", (ctx) => {
        successResponse(ctx, stops);
    });

    router.get("/builds", async (ctx) => {
        const filenames = await readDirAsync(OUTPUT_PATH);
        const builds = {};

        for (let i = 0; i < filenames.length; i++) {
            try {
                const identifier = filenames[i];
                // eslint-disable-next-line no-await-in-loop
                const data = await readFileAsync(path.join(OUTPUT_PATH, identifier, "build.json"));
                builds[identifier] = JSON.parse(data);
            } catch (error) {
                if (!["ENOENT", "ENOTDIR"].includes(error.code)) {
                    return errorResponse(ctx, error);
                }
            }
        }
        return successResponse(ctx, builds);
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
        .use(jsonBody({ fallback: true }))
        .use(router.routes())
        .use(router.allowedMethods())
        .listen(PORT, () => {
            console.log(`Listening at port ${PORT}`);  // eslint-disable-line no-console
        });
}

main().catch((error) => {
    console.error(error); // eslint-disable-line no-console
});
