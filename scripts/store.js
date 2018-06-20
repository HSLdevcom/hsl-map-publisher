const uuidv1 = require("uuid/v1");
const camelCase = require("lodash/camelCase");
const snakeCase = require("lodash/snakeCase");
const config = require("../knexfile");
const knex = require("knex")(config);
const pMap = require("p-map");
const path = require("path");
const merge = require("lodash/merge");
const get = require("lodash/get");
const fs = require("fs");
const { promisify } = require("util");
const mkdirp = require("mkdirp");

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

function convertKeys(object, converter) {
    const obj = {};
    Object.keys(object)
          .forEach((key) => {
              obj[converter(key)] = object[key];
          });
    return obj;
}

async function migrate() {
    await knex.migrate.latest();
}

async function getBuilds() {
    const rows = await knex.select(
        "build.*",
        knex.raw("count(case when poster.status = 'PENDING' then 1 end)::integer as pending"),
        knex.raw("count(case when poster.status = 'FAILED' then 1 end)::integer as failed"),
        knex.raw("count(case when poster.status = 'READY' then 1 end)::integer as ready"),
                           )
                           .from("build")
                           .whereNot("build.status", "REMOVED")
                           .leftJoin("poster", "build.id", "poster.build_id")
                           .orderBy("build.created_at", "desc")
                           .groupBy("build.id");

    return rows.map(row => convertKeys(row, camelCase));
}

async function getBuild({ id }) {
    const buildRow = await knex
        .select("*")
        .from("build")
        .whereNot("build.status", "REMOVED")
        .andWhere("build.id", id)
        .first();

    if (!buildRow) {
        const error = new Error(`Build ${id} not found`);
        error.status = 404;
        throw error;
    }

    const posterRows = await knex
        .select(
            "poster.id",
            "poster.status",
            "poster.component",
            "poster.props",
            "poster.created_at",
            "poster.updated_at",
            knex.raw(`json_agg(
                json_build_object(
                    'type', event.type,
                    'message', event.message,
                    'createdAt', event.created_at
                ) order by event.created_at
            ) as events`),
        )
        .from("poster")
        .whereNot("poster.status", "REMOVED")
        .andWhere("poster.build_id", id)
        .leftJoin("event", "event.poster_id", "poster.id")
        .groupBy("poster.id");

    const build = convertKeys(buildRow, camelCase);
    const posters = posterRows.map(row => convertKeys(row, camelCase));
    return Object.assign({}, build, { posters });
}

async function addBuild({ title }) {
    const id = uuidv1();
    await knex("build")
        .insert({
            id,
            title,
        });
    return { id };
}

async function updateBuild({ id, status }) {
    await knex("build")
        .where({ id })
        .update({ status });
    return { id };
}

async function removeBuild({ id }) {
    await knex("build")
        .where({ id })
        .update({ status: "REMOVED" });
    return { id };
}

async function getPoster({ id }) {
    const row = await knex
        .select("*")
        .from("poster")
        .whereNot("poster.status", "REMOVED")
        .andWhere("poster.id", id)
        .first();

    if (!row) {
        const error = new Error(`Poster ${id} not found`);
        error.status = 404;
        throw error;
    }
    return convertKeys(row, camelCase);
}

async function addPoster({ buildId, component, props }) {
    const id = uuidv1();
    await knex("poster")
        .insert(convertKeys({
            id,
            buildId,
            component,
            props,
        }, snakeCase));
    return { id };
}

async function updatePoster({ id, status }) {
    await knex("poster")
        .where({ id })
        .update({ status });
    return { id };
}

async function removePoster({ id }) {
    await knex("poster")
        .where({ id })
        .update({ status: "REMOVED" });
    return { id };
}

async function addEvent({
    posterId = null, buildId = null, type, message,
}) {
    await knex("event")
        .insert(convertKeys({
            posterId,
            buildId,
            type,
            message,
        }, snakeCase));
}

const templates = [
    {
        area: "footer",
        id: "footer_ticketsales",
        label: "Footer - Ticketsales",
        images: [
            {
                src: "ticket_sales.svg",
                size: 1,
            }, {
                src: "stop_feedback.svg",
                size: 1,
            }, {
                src: "ticket_zones.svg",
                size: 1,
            },
        ],
    },
];

const templateImagePath = (templateName, fileName) =>
    path.join(__dirname, "..", "templates", templateName, fileName);

async function getTemplates() {
    return pMap(templates, async template => Object.assign(template, {
        images: await pMap(template.images, async (image) => {
            const svgPath = templateImagePath(template.id, image.src);
            let svg = "";

            try {
                svg = await readFileAsync(svgPath, "utf-8");
            } catch (e) {
                svg = "";
            }

            return Object.assign(image, { svg });
        }),
    }));
}

async function addTemplate({ label }) {
    const templateId = snakeCase(label);
    const templatePath = path.join(__dirname, "..", "templates", templateId);

    mkdirp(templatePath, { mode: 755 });

    const template = {
        label,
        id: templateId,
        area: "footer",
        images: [
            {
                src: "",
                size: 1,
            }, {
                src: "",
                size: 1,
            }, {
                src: "",
                size: 1,
            },
        ],
    };

    templates.push(template);
    return template;
}

async function saveTemplateImages(templateId, images) {
    return pMap(images, async (image) => {
        const svgContent = get(image, "svg", "");
        delete image.svg;

        if (!svgContent) {
            return image;
        }

        const svgPath = templateImagePath(templateId, image.src);

        try {
            await writeFileAsync(svgPath, svgContent);
        } catch (e) {
            const error = new Error(`SVG ${image.src} write failed.`);
            error.status = 400;
            throw error;
        }

        return image;
    });
}

async function saveTemplate(template) {
    const { id } = template;
    const existingTemplateIndex = templates.findIndex(temp => temp.id === id);

    const newTemplate = { ...template };
    const savedImages = await saveTemplateImages(template.id, newTemplate.images);
    newTemplate.images = savedImages;

    if (existingTemplateIndex === -1) {
        templates.push(newTemplate);
    } else {
        merge(templates[existingTemplateIndex], newTemplate);
    }
}

module.exports = {
    migrate,
    getBuilds,
    getBuild,
    addBuild,
    updateBuild,
    removeBuild,
    getPoster,
    addPoster,
    updatePoster,
    removePoster,
    addEvent,
    getTemplates,
    addTemplate,
    saveTemplate,
};
