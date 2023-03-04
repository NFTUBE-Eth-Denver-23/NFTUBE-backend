import { Express, Request, Response, NextFunction } from 'express';
import colors from 'colors';

import { showService } from '../controllers/indexCtrl';

import { queryUser, queryUserByTag, saveUser, queryUserByWallet } from '../controllers/usersCtrl';

const initilizeRoutes = (app: Express): void => {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(colors.yellow(new Date().toISOString()));
    next();
  });

  app.route('/').get(showService);

  app.route('/query_user_by_tag/:userTag').get(queryUserByTag);

  app.route('/query_user/:userId').get(queryUser);

  app.route('/save_user').post(saveUser).put(saveUser);

  app.route('/query_user_by_wallet_address/:address/:chain').get(queryUserByWallet);

  app.route('/create_collection_ipfs_url').post();
};

export { initilizeRoutes };
