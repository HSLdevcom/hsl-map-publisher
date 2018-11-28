exports.up = async knex => {
  await knex.schema.createTable('template_images', table => {
    table.string('name').primary();
    table.text('svg').notNullable();
    table.integer('default_size').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = async knex => {
  await knex.schema.dropTable('template_images');
};
