exports.up = async knex => {
  await knex('template')
    .where({ rules: null })
    .update({ rules: '{}' });
  await knex.schema.table('template', table => {
    table
      .json('rules')
      .notNullable()
      .defaultTo('{}')
      .alter();
  });
};

exports.down = async knex => {
  await knex.schema.alterTable('template', table => {
    table
      .json('rules')
      .nullable()
      .alter();
  });
};
