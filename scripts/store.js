const uuidv1 = require("uuid/v1");
const camelCase = require("lodash/camelCase");
const snakeCase = require("lodash/snakeCase");
const pMap = require("p-map");
const merge = require("lodash/merge");
const get = require("lodash/get");
const config = require("../knexfile");
// eslint-disable-next-line import/order
const knex = require("knex")(config);
const createEmptyTemplate = require("./createEmptyTemplate");
const cleanup = require("./cleanup");

// Must cleanup knex, otherwise the process keeps going.
cleanup(() => {
    knex.destroy();
});

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
    const rows = await knex.select("build.*", knex.raw("count(case when poster.status = 'PENDING' then 1 end)::integer as pending"), knex.raw("count(case when poster.status = 'FAILED' then 1 end)::integer as failed"), knex.raw("count(case when poster.status = 'READY' then 1 end)::integer as ready"))
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
        .select("poster.id", "poster.status", "poster.component", "poster.props", "poster.created_at", "poster.updated_at", knex.raw(`json_agg(
                json_build_object(
                    'type', event.type,
                    'message', event.message,
                    'createdAt', event.created_at
                ) order by event.created_at
            ) as events`))
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

async function getTemplateImage(slot, fields = "*") {
    const emptySlot = {
        imageName: "",
        svg: "",
        size: get(slot, "size", 1),
    };

    if (!slot.imageName) {
        return emptySlot;
    }

    const dbImg = await knex
        .select(fields)
        .from("template_images")
        .where({ name: slot.imageName })
        .first();

    if (dbImg) {
        return merge({}, slot, dbImg);
    }

    return emptySlot;
}

async function getTemplateImages(template, fields = "*") {
    if (!template) {
        return template;
    }

    return Object.assign(template, {
        areas: await pMap(template.areas, async (area) => {
            // eslint-disable-next-line no-param-reassign
            area.slots = await pMap(area.slots, slot => getTemplateImage(slot, fields));
            return area;
        }),
    });
}

async function getTemplates() {
    const templates = await knex("template")
        .select("*")
        .orderBy("created_at", "asc");
    return pMap(templates, getTemplateImages);
}

async function addTemplate({ label }) {
    const templateId = snakeCase(label);
    const template = createEmptyTemplate(label, templateId);

    await knex("template")
        .insert(template);

    return template;
}

async function getTemplate({ id }, imageFields = "*") {
    const templateRow = await knex
        .select("*")
        .from("template")
        .where({ id })
        .first();

    if (imageFields === "none") {
        return templateRow;
    }

    return getTemplateImages(templateRow, imageFields);
}

// Not exported. Saves the passed images into the database.
async function saveTemplateImages(images) {
    return pMap(images, async (image) => {
        if (!image.name) {
            return image;
        }

        const existingImage = await knex
            .select("*")
            .from("template_images")
            .where({ name: image.name })
            .first();

        const svgContent = get(image, "svg", "");
        const name = existingImage ? existingImage.name : image.name;

        const newImage = {
            name,
            svg: svgContent,
            default_size: image.size,
        };

        if (existingImage) {
            await knex("template_images")
                .where({ name })
                .update(newImage);
        } else {
            await knex("template_images")
                .insert(newImage);
        }

        return image;
    });
}

async function saveTemplate(template) {
    const { id } = template;
    const existingTemplate = await getTemplate({ id }, false);

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

async function removeTemplate({ id }) {
    if (id === "default_footer") {
        const error = new Error("You cannot remove the default template.");
        error.status = 400;
        throw error;
    }

    await knex("template")
        .where({ id })
        .del();

    return { id };
}

async function getImages() {
    return knex("template_images")
        .select("*")
        .orderBy("updated_at", "asc");
}

function templateHasImage(template, imageName) {
    return template.images.some(img => img.name === imageName);
}

async function removeImage({ name }) {
    const templates = await knex("template")
        .select("*");

    if (templates.some(template => templateHasImage(template, name))) {
        const error = new Error(`Image '${name}' is in use in one or more templates!`);
        error.status = 400;
        throw error;
    }

    await knex("template_images")
        .where({ name })
        .del();

    return { name };
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
    getTemplate,
    addTemplate,
    saveTemplate,
    removeTemplate,
    getImages,
    removeImage,
};
