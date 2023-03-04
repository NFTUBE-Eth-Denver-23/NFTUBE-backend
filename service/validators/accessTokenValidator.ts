export const accessTokenValidator = (header: any) => {
  let { authorization: accessToken } = header;
  accessToken = accessToken?.split(' ')[1];
  if (!accessToken) {
    return false;
  }
  return accessToken;
};
