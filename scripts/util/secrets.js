const { mapValues, orderBy, get } = require('lodash');
const fs = require('fs-extra');

const SECRETS_PATH = '/run/secrets/';

// Check each env var and see if it has a value in the secrets. In that case, use the
// secret value. Otherwise use the env var. Using sync fs methods for the sake of
// simplicity, since this will only run once when staring the app, sync is OK.
const secrets = (fs.existsSync(SECRETS_PATH) && fs.readdirSync(SECRETS_PATH)) || [];

const secretsEnv = mapValues(process.env, (value, key) => {
  const matchingSecrets = secrets.filter(secretFile => secretFile.startsWith(key));

  const currentSecret =
    orderBy(
      matchingSecrets,
      secret => {
        const secretVersion = parseInt(secret[secret.length - 1], 10);
        // eslint-disable-next-line no-restricted-globals
        return isNaN(secretVersion) ? 0 : secretVersion;
      },
      'desc',
    )[0] || null;

  const filepath = SECRETS_PATH + currentSecret;

  if (fs.existsSync(filepath)) {
    return (fs.readFileSync(filepath, { encoding: 'utf8' }) || '').trim();
  }

  return value;
});

function getSecret(secretName) {
  return get(secretsEnv, secretName, '');
}

module.exports = {
  getSecret,
};
