if (!process.env.PG_CONNECTION_STRING) {
  throw new Error('PG_CONNECTION_STRING variable is not set');
}

module.exports = {
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING,
};
