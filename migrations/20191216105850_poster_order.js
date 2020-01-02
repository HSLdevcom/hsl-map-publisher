exports.up = async function(knex) {
  await knex.schema.alterTable('poster', table => {
    table.integer('order');
  });
};

exports.down = function() {};
