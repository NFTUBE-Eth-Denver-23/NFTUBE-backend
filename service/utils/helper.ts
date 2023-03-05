import bcrypt from 'bcrypt';
import logger from '../../logger';
import { isEmpty } from 'lodash';

const saltRounds = 3;

export type cacheSetterObject = {
  setter: Function;
  params: Array<any>;
};

const hash = async (key: string | Buffer) => {
  const salt = await bcrypt.genSalt(saltRounds).catch((err) => {
    logger.error(`Error occured during generating salt rounds while hashing: ${err.message}`);
    logger.error(err.stack);
    throw err;
  });

  return await bcrypt.hash(key, salt).catch((err) => {
    logger.error(`Error occured during generating hash value: ${err.message}`);
    logger.error(err.stack);
    throw err;
  });
};
