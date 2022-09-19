const fetch = require('node-fetch');

const { CLIENT_ID, REDIRECT_URI, LOGIN_PROVIDER_URI, API_CLIENT_ID } = process.env;

const { CLIENT_SECRET, API_CLIENT_SECRET, TESTING_REDIRECT_URI } = require('../../constants');

const authHash = Buffer.from(`${API_CLIENT_ID}:${API_CLIENT_SECRET}`).toString('base64');

const requestAccessToken = async props => {
  const redirectUri = props.isTesting ? TESTING_REDIRECT_URI : REDIRECT_URI;
  const url = `${LOGIN_PROVIDER_URI}/openid/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&code=${props.code}&redirect_uri=${redirectUri}`;
  const response = await fetch(url, {
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
  const response = await fetch(url, {
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
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

const requestGroups = async () => {
  const url = `${LOGIN_PROVIDER_URI}/api/rest/v1/group`;
  const groupsResponse = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${authHash}`,
    },
  });

  return groupsResponse.json();
};

const setGroup = async (userId, groupNames) => {
  const url = `${LOGIN_PROVIDER_URI}/api/rest/v1/user/${userId}`;
  const groups = await requestGroups();
  const groupIds = [];
  groups.resources.forEach(group => {
    if (groupNames.includes(group.name)) {
      groupIds.push(group.id);
    }
  });
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${authHash}`,
    },
    body: JSON.stringify({
      memberOf: groupIds,
    }),
  });

  return response.json();
};

module.exports = { requestAccessToken, requestUserInfo, logoutFromIdentityProvider, setGroup };
