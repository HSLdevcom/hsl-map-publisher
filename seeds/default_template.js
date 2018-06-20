exports.seed = function (knex) {
    return knex("template")
        .del()
        .then(() => knex("template")
            .insert([
                {
                    area: "footer",
                    id: "default_footer",
                    label: "Default footer",
                    images: JSON.stringify([
                        {
                            id: "",
                            name: "",
                            svg: "",
                            size: 1,
                        },
                        {
                            id: "",
                            name: "",
                            svg: "",
                            size: 1,
                        },
                        {
                            id: "",
                            name: "",
                            svg: "",
                            size: 1,
                        },
                    ]),
                },
            ]));
};
