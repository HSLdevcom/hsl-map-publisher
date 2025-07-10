const { get, clone } = require('lodash');
const AuthService = require('./authService');

const { GROUP_GENERATE, GROUP_READONLY } = require('../../constants');

const hasAllowedGroup = async userInfo => {
  const groups = get(userInfo, 'groups', {});

  if (!groups || !Array.isArray(groups)) {
    console.log('User does not have valid groups assigned');
    return false;
  }
  if (groups.includes(GROUP_GENERATE) || groups.includes(GROUP_READONLY)) {
    return true;
  }
  return false;
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
        message: 'No authorization code',
      },
      status: 401,
    };
  }

  const tokenResponse = await AuthService.requestAccessToken({
    code: authRequest.code,
    isTesting,
  });

  if (session && tokenResponse.access_token) {
    modifiedSession.accessToken = tokenResponse.access_token;
    const userInfo = await AuthService.requestUserInfo(modifiedSession.accessToken);
    const isAllowed = await hasAllowedGroup(userInfo);
    if (!isAllowed) {
      return {
        status: 401,
        body: {
          isOk: false,
          message: 'User does not have valid groups assigned.',
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
    const isAllowed = await hasAllowedGroup(session);
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
