import {
  CognitoUserPool,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUser,
  CognitoRefreshToken
} from 'amazon-cognito-identity-js';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import config from '../../config.json';
import logger from '../../logger';

const userPoolId = 'us-west-1_8lAFpYTCN';
const clientId = '7nlqgqtpelact0go4hdbb79g13';
const email = 'test@gmail.com';
const password = 'Test@12341234';

const poolData = {
  UserPoolId: userPoolId,
  ClientId: clientId
};

const userPool = new CognitoUserPool(poolData);

// This verifier will trust both User Pools
const idTokenVerifier = CognitoJwtVerifier.create([
  {
    userPoolId: config.cognotiUserPoolId,
    tokenUse: 'access',
    clientId: config.cognitoWebClient
  }
]);

const verifyJWTToken = async (accessToken: string, userId: string): Promise<boolean> => {
  if (!accessToken || !userId) {
    return false;
  }

  try {
    const idTokenPayload = await idTokenVerifier.verify(
      accessToken // token must be signed by either of the User Pools
    );
    logger.debug('Supplied Token is valid for ' + userId);
    return idTokenPayload.sub === userId;
  } catch (err) {
    logger.error(err);
    logger.error(`Supplied Token not valid for ${userId}`);
    return false;
  }
};

// this is to assist testing Cognito authenticated endpoints
const generateTestJWTToken = async (): Promise<any> => {
  let authenticationData = {
    Username: email,
    Password: password
  };

  let authenticationDetails = new AuthenticationDetails(authenticationData);

  let userData = {
    Username: email,
    Pool: userPool
  };

  let cognitoUser = new CognitoUser(userData);

  const getTokenData = () => {
    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
          const sub = result.getIdToken().payload.sub;
          const accessToken = result.getAccessToken().getJwtToken();
          resolve({ jwtToken: accessToken, sub: sub });
        },
        onFailure: function (err) {
          console.log(err);
          reject(err);
        }
      });
    });
  };

  return await getTokenData();
};

export { generateTestJWTToken, verifyJWTToken };
