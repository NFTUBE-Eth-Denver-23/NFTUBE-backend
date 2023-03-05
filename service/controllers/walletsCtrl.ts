import { Request, Response } from 'express';
import logger from '../../logger';
import { validateAPIKey } from '../validators/apiKeyValidator';
import { getUser, getWallet, getWalletsByUserIdAndChain, putWallet } from '../providers/ddbProvider';

import { Wallet } from '../models/Wallet';
import { verifyJWTToken } from '../providers/cognitoProvider';
import { accessTokenValidator } from '../validators/accessTokenValidator';
import { walletValidator } from '../validators/walletValidator';
import { isEmpty } from 'lodash';

const saveWallet = async (req: Request, res: Response) => {
  const walletData = req.body.data;
  const apiKey = req.query.API_KEY as string;
  const { userId, appId, device } = req.body;
  const accessToken = accessTokenValidator(req.headers);

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  const { address, chain, signature, chainId } = walletData;

  if (!address || !chain || !signature)
    return res.json({
      success: false,
      message: 'Validation Error: address & chain & signature must exist'
    });

  if (!accessToken) {
    return res.json({
      success: false,
      message: `Validation Error: Access token should be provided.`
    });
  }
  const validJWTToken = await verifyJWTToken(accessToken, userId);

  if (!validJWTToken) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid JWT Token.`
    });
  }

  const isValidAddress = walletValidator({
    address,
    signature,
    chainId,
    value: userId
  });
  if (!isValidAddress) {
    return res.json({
      success: false,
      message: `Validation Error: presented address isn't owner of signature`
    });
  }

  try {
    walletData.connectedTime = Date.now();
    if (appId) {
      walletData['appId'] = appId;
    }
    const wallet = new Wallet(walletData);
    const response = await putWallet(wallet);
    return res.json({
      success: true,
      data: response.makeObject()
    });
  } catch (err: any) {
    logger.error(`Error occured during saveWallet: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during saveWallet: ${err.message}`
    });
  }
};

const queryWalletsByUserIdAndChain = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const chain = req.params.chain;

  try {
    let wallets = await getWalletsByUserIdAndChain(userId, chain);
    wallets.sort((a: Wallet, b: Wallet) => b.connectedTime - a.connectedTime);

    return res.json({
      success: true,
      data: wallets
    });
  } catch (err: any) {
    logger.error(`Error occured during queryWalletsByUserIdAndChain: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryWalletsByUserIdAndChain: ${err.message}`
    });
  }
};
const queryRecentWalletByUserIdAndChain = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const chain = req.params.chain;

  try {
    let wallets = await getWalletsByUserIdAndChain(userId, chain);
    wallets.sort((a: Wallet, b: Wallet) => b.connectedTime - a.connectedTime);

    const latestWallet: string = wallets[0]?.address || '';

    return res.json({
      success: true,
      data: latestWallet
    });
  } catch (err: any) {
    logger.error(`Error occured during queryRecentWalletByUserIdAndChain: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryRecentWalletByUserIdAndChain: ${err.message}`
    });
  }
};

const queryUserByWallet = async (req: Request, res: Response) => {
  const address = req.params.address;
  const chain = req.params.chain;

  try {
    const wallet = await getWallet(address, chain);

    if (!wallet || !wallet.userId) {
      return res.json({
        success: false,
        message: `Validation Error: given wallet does not exist or userId does not exist in wallet data.`
      });
    }

    const result = await getUser(wallet.userId);

    return res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    logger.error(`Error occured during queryUserByWallet: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryUserByWallet: ${err.message}`
    });
  }
};

export { saveWallet, queryWalletsByUserIdAndChain, queryRecentWalletByUserIdAndChain, queryUserByWallet };
