import config from '../../config.json';

const validateAPIKey = (apiKey: string) => {
  return config.allowedAPIKeys.includes(apiKey);
};

export { validateAPIKey };
