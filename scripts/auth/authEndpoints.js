const { get, last, clone } = require('lodash');
const AuthService = require('./authService');

const { DOMAINS_ALLOWED_TO_LOGIN, PUBLISHER_TEST_GROUP } = require('../../constants');

const allowedDomains = DOMAINS_ALLOWED_TO_LOGIN.split(',');

const hasAllowedDomain = async userInfo => {
  const groups = get(userInfo, 'groups');
  const domain = last(userInfo.email.toLowerCase().split('@')) || '';

  if (groups.includes(PUBLISHER_TEST_GROUP)) {
    return true;
  }

  if (!allowedDomains.includes(domain) && !groups.includes(PUBLISHER_TEST_GROUP)) {
    console.log(`User does not have allowed domain. Logging out.`);
    return false;
  }

  return true;
};

const authorize = async (req, res, session) => {
  const authRequest = req.body;
  const modifiedSession = clone(session);
  const { isTesting } = authRequest;

  if (modifiedSession && isTesting) {
    // When testing, code is already an access token (because tests fetched code with password grant request that gives you the correct access token)
    modifiedSession.accessToken = authRequest.code;
    const userInfo = await AuthService.requestUserInfo(authRequest.code);
    modifiedSession.email = userInfo.email;
    modifiedSession.groups = userInfo.groups;
    return {
      status: 200,
      body: {
        isOk: true,
        email: userInfo.email,
      },
      modifiedSession,
    };
  }

  if (!authRequest.code) {
    console.log('No authorization code');
    return {
      body: {
        isOk: false,
      },
      status: 401,
    };
  }
  const tokenResponse = await AuthService.requestAccessToken(authRequest.code, isTesting);

  if (session && tokenResponse.access_token) {
    modifiedSession.accessToken = tokenResponse.access_token;
    const userInfo = await AuthService.requestUserInfo(modifiedSession.accessToken);
    const isAllowed = await hasAllowedDomain(userInfo);
    if (!isAllowed) {
      return {
        status: 401,
        body: {
          isOk: false,
          message: 'No allowed group.',
        },
      };
    }

    modifiedSession.email = userInfo.email;
    modifiedSession.groups = userInfo.groups;

    const response = {
      isOk: true,
      email: userInfo.email,
    };

    return {
      status: 200,
      body: response,
      modifiedSession,
    };
  }
  console.log('No access token: ', tokenResponse);
  const response = {
    isOk: false,
  };
  return {
    status: 401,
    body: response,
  };
};

const checkExistingSession = async (req, res, session) => {
  if (session && session.accessToken) {
    const isAllowed = await hasAllowedDomain(session);
    if (!isAllowed) {
      await AuthService.logoutFromIdentityProvider(session.accessToken);
      return {
        status: 200,
      };
    }

    const response = {
      isOk: true,
      email: session.email,
      groups: session.groups,
    };
    return {
      status: 200,
      body: response,
    };
  }
  // console.log('No existing session');
  const response = {
    isOk: false,
  };
  return {
    status: 200,
    body: response,
  };
};

const logout = async (req, res, session) => {
  if (session && session.accessToken) {
    await AuthService.logoutFromIdentityProvider(session.accessToken);
    return {
      status: 200,
    };
  }
  return {
    status: 401,
  };
};

module.exports = {
  authorize,
  checkExistingSession,
  logout,
};
