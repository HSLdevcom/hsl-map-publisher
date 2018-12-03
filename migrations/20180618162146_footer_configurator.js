exports.up = async knex => {
  await knex.schema.createTable('template', table => {
    table.string('id').primary();
    table.string('label').notNullable();
    table.jsonb('areas').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async knex => {
  await knex.schema.dropTable('template');
};
