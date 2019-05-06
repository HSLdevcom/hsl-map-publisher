const nodeFetch = require('node-fetch');

// Move to .env
const CLIENT_ID="0573682632536260";
const CLIENT_SECRET="yJD0C4H4hdKVN0L9PKldWptcx1IqhVuR";
const REDIRECT_URI="http://localhost:3000";
const LOGIN_PROVIDER_URI="https://hslid-uat.cinfra.fi";

console.log(CLIENT_ID, CLIENT_SECRET)

const requestAccessToken = async (code) => {
  const url = `${LOGIN_PROVIDER_URI}/openid/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`
  const response = await nodeFetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
  return (await response.json());
}

const requestUserInfo = async (accessToken) => {
  const url = `${LOGIN_PROVIDER_URI}/openid/userinfo`
  const response = await nodeFetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const responseJson = await response.json()

  return {
    userId: responseJson.sub,
    email: responseJson.email,
    emailVerified: responseJson.email_verified,
    groups: responseJson['https://oneportal.trivore.com/claims/groups'],
  }
}

const logoutFromIdentityProvider = async (accessToken) => {
  const url = `${LOGIN_PROVIDER_URI}/openid/logout`
  return nodeFetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

module.exports = { requestAccessToken, requestUserInfo, logoutFromIdentityProvider }
