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
const PDFDocument = require("pdfkit");
const fetch = require("node-fetch");

const generator = require("./generator");

// 5 * 72 = 360 dpi
const SCALE = 5;

const PORT = 4000;

const OUTPUT_PATH = path.join(__dirname, "..", "output");
const TEMPLATE = template(fs.readFileSync(path.join(__dirname, "index.html")));

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
                        hasShelter: stop.pysakkityyppi.includes("katos"),
                    }))
                    .sort((a, b) => a.shortId.localeCompare(b.shortId));
                resolve(stops);
            })
        );
    });
}

function generatePdf(directory, filenames, dimensions) {
    const doc = new PDFDocument({ autoFirstPage: false });
    doc.pipe(fs.createWriteStream(path.join(directory, "rgb.pdf")));

    filenames.forEach((filename, index) => {
        // Skip failed pages
        if (!dimensions[index]) return;

        // Dimensions in PDF points
        const width = dimensions[index].width / SCALE;
        const height = dimensions[index].height / SCALE;

        doc.addPage({ size: [width, height] });
        doc.image(path.join(directory, filename), 0, 0, { width });
    });
    doc.end();
}

function generateFiles(component, props) {
    const identifier = moment().format("YYYY-MM-DD-HHmm-sSSSSS");
    const directory = path.join(OUTPUT_PATH, identifier);

    fs.mkdirSync(directory);
    const stream = fs.createWriteStream(path.join(directory, "build.log"));

    const promises = [];
    const filenames = [];
    for (let i = 0; i < props.length; i++) {
        const filename = `${i + 1}.png`;
        const options = {
            stream,
            filename,
            directory,
            component,
            props: props[i],
            scale: SCALE,
        };
        filenames.push(filename);
        promises.push(generator.generate(options));
    }

    Promise.all(promises)
        .then((dimensions) => {
            generatePdf(directory, filenames, dimensions);
            stream.end("DONE");
        })
        .catch((error) => {
            console.error(error); // eslint-disable-line no-console
            stream.end(`ERROR: ${error.message}`);
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
    await generator.initialize();

    const app = new Koa();
    const router = new Router();

    router.get("/stops", (ctx) => {
        successResponse(ctx, stops);
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
