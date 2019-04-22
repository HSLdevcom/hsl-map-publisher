const nodeFetch = require('node-fetch');
// import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, LOGIN_PROVIDER_URI } from '../constants'

const asd = process.env.CLIENT_SECRET;
console.log(asd);

const CLIENT_ID="2507101457541763";
const CLIENT_SECRET="QPDTcRKd7t3OR3y4TNRcK19HTgLKPRXp";
const REDIRECT_URI="http://localhost:3000";
const LOGIN_PROVIDER_URI="https://hslid-uat.cinfra.fi";

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
