exports.seed = function (knex, Promise) {
    return knex("template")
        .insert([
            {
                area: "footer",
                id: "default_footer",
                label: "Default footer",
                images: JSON.stringify([
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
                ]),
            },
        ]);
};
