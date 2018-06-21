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
const createEmptyTemplate = require("./createEmptyTemplate");

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
        knex.raw("count(case when poster.status = 'READY' then 1 end)::integer as ready")
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
            ) as events`)
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

const templateImagePath = (templateName, fileName) =>
    path.join(__dirname, "..", "templates", templateName, fileName);

async function getTemplates() {
    const templates = await knex("template")
        .select("*");

    return pMap(templates, async template => Object.assign(template, {
        images: await pMap(template.images, async (image) => {
            const emptyImage = {
                id: "",
                name: "",
                svg: "",
                size: 1,
            };

            if (!image.id) {
                return emptyImage;
            }

            const img = await knex
                .select("*")
                .from("template_images")
                .where({ id: image.id })
                .first();

            img.size = img.default_size;
            return img || emptyImage;
        }),
    }));
}

async function addTemplate({ label }) {
    const templateId = snakeCase(label);
    const template = createEmptyTemplate(label, templateId);

    await knex("template")
        .insert(template);

    return template;
}

async function saveTemplateImages(images) {
    return pMap(images, async (image) => {
        let existingImage = null;

        if (image.id) {
            existingImage = await knex
                .select("*")
                .from("template_images")
                .where({ id: image.id })
                .first();
        }

        const svgContent = get(image, "svg", "");
        const id = existingImage ? existingImage.id : uuidv1();

        const newImage = {
            id,
            name: image.name,
            svg: svgContent,
            default_size: image.size,
        };

        if (existingImage) {
            await knex("template_images")
                .where({ id })
                .update(newImage);
        } else {
            await knex("template_images")
                .insert(newImage);
        }

        Object.assign(image, { id });

        return image;
    });
}

async function getTemplate({ id }) {
    const templateRow = await knex
        .select("*")
        .from("template")
        .where({ id })
        .first();

    return templateRow;
}

async function saveTemplate(template) {
    const { id } = template;
    const existingTemplate = await getTemplate({ id });

    const newTemplate = merge({}, template);

    const savedImages = await saveTemplateImages(newTemplate.images);
    newTemplate.images = JSON.stringify(savedImages);

    if (existingTemplate) {
        await knex("template")
            .where({ id })
            .update(newTemplate);
    } else {
        await knex("template")
            .insert(template);
    }

    return newTemplate;
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
