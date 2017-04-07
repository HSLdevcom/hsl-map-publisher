const fs = require("fs");
const path = require("path");

const Koa = require("koa");
const Router = require("koa-router");
const cors = require("koa-cors");
const body = require("koa-json-body");
const serveList = require("koa-serve-list");
const serveStatic = require("koa-static");

const moment = require("moment");
const urljoin = require("url-join");
const pick = require("lodash/pick");
const iconv = require("iconv-lite");
const csv = require("csv");
const PDFDocument = require("pdfkit");

const generator = require("./generator");

const PORT = 4000;
const API_URL = "http://kartat.hsl.fi";
const OUTPUT_PATH = path.join(__dirname, "..", "output");

const IMAGE_PPI = 300;
const PDF_PPI = 72;

// FIXME: Fetch stops from graphql when data available
function fetchStopsWithShelter() {
    return new Promise((resolve, reject) => {
        fs.createReadStream(`${__dirname}/jr_map_pysakit_varustus.txt`)
            .pipe(iconv.decodeStream("ISO-8859-1"))
            .pipe(csv.parse({ delimiter: "#", columns: true }, (err, data) => {
                if (err) reject(err);
                const stops = data.map(stop => ({
                    stopId: stop.tunnus,
                    shortId: stop.lyhyt_nro,
                    nameFi: stop.nimi_suomi,
                    group: `${stop.aikataulutyyppi_hsl}${stop.aikataulutyyppi_hkl}`,
                    index: stop.ajojarjestys,
                    hasShelter: stop.pysakkityyppi.includes("katos"),
                }));
                resolve(stops);
            })
        )
    });
}

function generatePdf(directory, filenames, dimensions) {
    const doc = new PDFDocument({ autoFirstPage: false });
    doc.pipe(fs.createWriteStream(path.join(directory, "rgb.pdf")));

    filenames.forEach((filename, index) => {
        // Skip failed pages
        if (!dimensions[index]) return;

        // Dimensions in PDF points
        const width = dimensions[index].width * (PDF_PPI / IMAGE_PPI);
        const height = dimensions[index].height * (PDF_PPI / IMAGE_PPI);

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

function successResponse(ctx, body) {
    ctx.status = 200;
    ctx.body = body;
}

function errorResponse(ctx, error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
    console.error(error);
    console.error(error.stack);
}

async function main() {
    const stops = await fetchStopsWithShelter();
    await generator.initialize();

    const app = new Koa();
    const router = new Router();

    router.get("/stops", (ctx) => {
        successResponse(ctx, stops);
    });

    router.post("/", (ctx) => {
        const { component, props } = ctx.request.body;

        if (typeof component !== "string" || !props instanceof Array || !props.length) {
            return errorResponse(ctx, new Error("Invalid request body"));
        }

        try {
            const identifier = generateFiles(component, props);
            const url = urljoin("http://", ctx.request.host, ctx.request.url, identifier, "/");
            successResponse(ctx, { url });
        } catch (error) {
            errorResponse(ctx, error);
        }
    });

    app
        .use(cors())
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
