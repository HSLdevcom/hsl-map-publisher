exports.up = async knex => {
  await knex.schema.table('poster', table => {
    table.string('template');
  });
};

exports.down = async knex => {
  await knex.schema.table('poster', table => {
    table.dropColumn('template');
  });
};
