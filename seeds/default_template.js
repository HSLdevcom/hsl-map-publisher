const createEmptyTemplate = require("../scripts/util/createEmptyTemplate");

exports.seed = function (knex) {
    return knex("template")
        .del()
        .then(() =>
            knex("template")
                .insert([
                    createEmptyTemplate("Default", "default"),
                ]));
};
