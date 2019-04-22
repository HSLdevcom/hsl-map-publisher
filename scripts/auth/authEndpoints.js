const AuthService = require('./authService');

const authorize = async (req, res, session) => {
  const authRequest = req.body;

  if (!Boolean(authRequest.code)) {
    console.log('No authorization code')
    return {
      body: {
        isOk: false,
      },
      status: 401,
    }
  }
  const tokenResponse = await AuthService.requestAccessToken(authRequest.code)

  if (session && tokenResponse.access_token) {
    session.accessToken = tokenResponse.access_token
    const userInfo = await AuthService.requestUserInfo(session.accessToken)
    session.email = userInfo.email
    session.groups = userInfo.groups

    const response = {
      isOk: true,
      email: userInfo.email,
    }

    return {
      status: 200,
      body: response,
      session,
    };
  } else {
    console.log('No access token: ', tokenResponse)
    const response = {
      isOk: false,
    }
    return {
      status: 401,
      body: response,
    };
  }
}

const checkExistingSession = async (req, res, session) => {
  if (session && session.accessToken) {
    const response = {
      isOk: true,
      email: session.email,
    }
    return {
      status: 200,
      body: response,
    };
  }
  console.log('No existing session')
  const response = {
    isOk: false,
  }
  return {
    status: 200,
    body: response,
  };
}

const logout = async (req, res, session) => {
  if (session && session.accessToken) {
    await AuthService.logoutFromIdentityProvider(session.accessToken)
    return {
      status: 200,
    };
  } else {
    return {
      status: 401,
    };
  }
}

module.exports = {
  authorize,
  checkExistingSession,
  logout,
}
