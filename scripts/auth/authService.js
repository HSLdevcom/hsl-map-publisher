const nodeFetch = require('node-fetch');

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, LOGIN_PROVIDER_URI } = process.env;

const requestAccessToken = async code => {
  const url = `${LOGIN_PROVIDER_URI}/openid/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`;
  const response = await nodeFetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

const requestUserInfo = async accessToken => {
  const url = `${LOGIN_PROVIDER_URI}/openid/userinfo`;
  const response = await nodeFetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const responseJson = await response.json();

  return {
    userId: responseJson.sub,
    email: responseJson.email,
    emailVerified: responseJson.email_verified,
    groups: responseJson['https://oneportal.trivore.com/claims/groups'],
  };
};

const logoutFromIdentityProvider = async accessToken => {
  const url = `${LOGIN_PROVIDER_URI}/openid/logout`;
  return nodeFetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

module.exports = { requestAccessToken, requestUserInfo, logoutFromIdentityProvider };
