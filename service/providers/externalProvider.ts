import axios from 'axios';
import logger from '../../logger';

const baseFetchGet = async (endpoint: string): Promise<any> => {
  const res = await axios(endpoint);
  logger.debug(`baseFetchGet to ${endpoint} complete.`);
  return res.data;
};

export { baseFetchGet };
