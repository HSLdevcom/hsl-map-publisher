exports.up = async knex => {
  await knex.schema.table('template', table => {
    table.json('rules');
  });
};

exports.down = async knex => {
  await knex.schema.table('template', table => {
    table.dropColumn('rules');
  });
};
