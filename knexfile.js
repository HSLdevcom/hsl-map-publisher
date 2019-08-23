const { PG_CONNECTION_STRING } = require('./constants');

if (!PG_CONNECTION_STRING) {
  throw new Error('PG_CONNECTION_STRING variable is not set');
}

module.exports = {
  client: 'pg',
  connection: PG_CONNECTION_STRING,
};
