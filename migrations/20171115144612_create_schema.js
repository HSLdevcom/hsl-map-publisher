
exports.up = async (knex) => {
    const buildStatus = ["OPEN", "CLOSED", "PRODUCTION", "REMOVED"];
    const posterStatus = ["PENDING", "FAILED", "READY", "REMOVED"];

    await knex.schema.createTable("build", (table) => {
        table.uuid("id").primary();
        table.enum("status", buildStatus).defaultTo("OPEN").notNullable();
        table.string("title").notNullable();
        table.timestamps(true, true);
    });
    await knex.schema.createTable("poster", (table) => {
        table.uuid("id").primary();
        table.uuid("build_id").references("id").inTable("build").notNullable();
        table.enum("status", posterStatus).defaultTo("PENDING").notNullable();
        table.string("component").notNullable();
        table.jsonb("props").notNullable();
        table.timestamps(true, true);
    });
    await knex.schema.createTable("event", (table) => {
        table.increments();
        table.uuid("build_id").references("id").inTable("build");
        table.uuid("poster_id").references("id").inTable("poster");
        table.enum("type", ["INFO", "ERROR"]).notNullable();
        table.text("message").notNullable();
        table.timestamps(true, true);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable("event");
    await knex.schema.dropTable("poster");
    await knex.schema.dropTable("build");
};
