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

const generator = require("./generator");

const PORT = 4000;
const API_URL = "http://kartat.hsl.fi";
const OUTPUT_PATH = path.join(__dirname, "..", "output");

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

function generateFiles(component, props) {
    const identifier = moment().format("YYYY-MM-DD-HHmm-sSSSSS");
    const basePath = path.join(OUTPUT_PATH, identifier);

    fs.mkdirSync(basePath);
    const stream = fs.createWriteStream(path.join(basePath, "build.log"));

    let last;
    for (let i = 0; i < props.length; i++) {
        const options = {
            stream,
            component,
            props: props[i],
            directory: basePath,
            filename: `${i + 1}.png`,
        };
        last = generator.generate(options);
    }
    last.then(() => stream.end("DONE"));

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
