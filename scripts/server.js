const fs = require("fs");
const path = require("path");

const Koa = require("koa");
const Router = require("koa-router");
const jsonBody = require("koa-json-body");
const serveStatic = require("koa-static");

const moment = require("moment");
const template = require("lodash/template");
const iconv = require("iconv-lite");
const csv = require("csv");
const fetch = require("node-fetch");
const spawn = require("child_process").spawn;
const promisify = require("util").promisify;

const generator = require("./generator");
const Logger = require("./logger");

const unlinkAsync = promisify(fs.unlink);

// 5 * 72 = 360 dpi
const SCALE = 5;
const PDF_PPI = 72;

const PORT = 4000;

const OUTPUT_PATH = path.join(__dirname, "..", "output");
const TEMPLATE = template(fs.readFileSync(path.join(__dirname, "index.html")));

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
                        hasShelter: stop.pysakkityyppi.includes("katos"),
                    }))
                    .sort((a, b) => a.shortId.localeCompare(b.shortId));
                resolve(stops);
            })
        );
    });
}

function generatePdf(directory, filenames) {
    return new Promise((resolve, reject) => {
        const pdftk = spawn("pdftk", [
            ...filenames,
            "cat",
            "output",
            path.join(directory, "output.pdf"),
        ]);
        pdftk.stderr.on("data", data => reject(new Error(data.toString())));
        pdftk.on("close", resolve);
    });
}

function convertToCmykPdf(filename) {
    const cmykFilename = filename.replace(".tiff", ".cmyk.tiff");
    return new Promise((resolve, reject) => {
        const cctiff = spawn("cctiff", ["rgb_test_out.icc", filename, cmykFilename]);
        cctiff.stderr.on("data", data => reject(new Error(data.toString())));
        cctiff.on("close", () => unlinkAsync(filename).then(() => {
            const pdfFilename = filename.replace(".tiff", ".pdf");
            const convert = spawn("convert", [
                "-density",
                SCALE * PDF_PPI,
                "-units",
                "PixelsPerInch",
                cmykFilename,
                pdfFilename,
            ]);
            convert.stderr.on("data", data => reject(new Error(data.toString())));
            convert.on("close", () => unlinkAsync(cmykFilename).then(() => resolve(pdfFilename)));
        }));
    }
  );
}

function generateFiles(component, props) {
    const identifier = moment().format("YYYY-MM-DD-HHmm-sSSSSS");
    const directory = path.join(OUTPUT_PATH, identifier);

    fs.mkdirSync(directory);
    const logger = new Logger(path.join(directory, "build.log"));

    const promises = [];
    for (let i = 0; i < props.length; i++) {
        const filename = `${i + 1}.tiff`;
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
            generator
                .generate(options)
                // eslint-disable-next-line no-loop-func
                .then((success) => {
                    queueLength--;
                    return success && convertToCmykPdf(path.join(directory, filename));
                })
        );
    }

    Promise.all(promises)
        .then(filenames => generatePdf(directory, filenames.filter(name => !!name)))
        .then(() => logger.end("DONE"))
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
        const { component, props } = ctx.request.body;

        if (typeof component !== "string" || !(props instanceof Array) || !props.length) {
            return errorResponse(ctx, new Error("Invalid request body"));
        }

        try {
            const filePath = generateFiles(component, props);
            return successResponse(ctx, { path: filePath });
        } catch (error) {
            return errorResponse(ctx, error);
        }
    });

    router.get("/:directory", (ctx) => {
        const directory = ctx.params.directory.replace(/(\.|\/|\\)/g, "");
        return new Promise((resolve) => {
            fs.readdir(path.join(OUTPUT_PATH, directory), (err, files) => {
                if (!err) {
                    successResponse(ctx, TEMPLATE({ title: directory, items: files }), "text/html");
                }
                resolve();
            });
        });
    });


    app
        .use(jsonBody({ fallback: true }))
        .use(router.routes())
        .use(router.allowedMethods())
        .use(serveStatic(OUTPUT_PATH))
        .listen(PORT, (err) => {
            if (err) {
                console.error(err);
            }
            console.log(`Listening at port ${PORT}`);
        });
}

main().catch(console.log.bind(console));
