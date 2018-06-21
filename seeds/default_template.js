const createEmptyTemplate = require("../scripts/createEmptyTemplate");

exports.seed = function (knex) {
    return knex("template")
        .del()
        .then(() =>
            knex("template")
                .insert([
                    createEmptyTemplate("Default footer", "default_footer"),
                ]));
};
