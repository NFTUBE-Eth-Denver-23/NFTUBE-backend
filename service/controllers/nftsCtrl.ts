import { Request, Response } from 'express';
import { validateAPIKey } from '../validators/apiKeyValidator';
import { accessTokenValidator } from '../validators/accessTokenValidator';
import {
  getNFT,
  getNFTbyDotId,
  getNFTsByCollectionId,
  getNFTsByCollectionAddress,
  getNFTbyCollectionAddressAndTokenId,
  putNFT
} from '../providers/ddbProvider';
import { uploadMetadata } from '../providers/s3Provider';
import { NFT } from '../models/NFT';
import { NFTIdentifier } from '../interfaces/NFTIdentifier';

import logger from '../../logger';
import { verifyJWTToken } from '../providers/cognitoProvider';

const queryNFT = async (req: Request, res: Response) => {
  const nftId = req.params.nftId;
  try {
    const nft = await getNFT(nftId);

    return res.json({
      success: true,
      data: nft
    });
  } catch (err: any) {
    logger.error(`Error occured during queryNFT: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryNFT: ${err.message}`
    });
  }
};

const queryNFTbyDotId = async (req: Request, res: Response) => {
  const dotId = req.params.dotId;

  try {
    const nft = await getNFTbyDotId(dotId);

    return res.json({
      success: true,
      data: nft
    });
  } catch (err: any) {
    logger.error(`Error occured during queryNFTbyDotId: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryNFTbyDotId: ${err.message}`
    });
  }
};

const queryNFTsbyCollectionId = async (req: Request, res: Response) => {
  const collectionId = req.params.collectionId;

  try {
    const nfts = await getNFTsByCollectionId(collectionId);

    return res.json({
      success: true,
      data: nfts
    });
  } catch (err: any) {
    logger.error(`Error occured during queryNFTsbyCollectionId: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryNFTsbyCollectionId: ${err.message}`
    });
  }
};

const queryNFTsbyCollectionAddress = async (req: Request, res: Response) => {
  const collectionAddress = req.params.collectionAddress;

  try {
    const nfts = await getNFTsByCollectionAddress(collectionAddress);

    return res.json({
      success: true,
      data: nfts
    });
  } catch (err: any) {
    logger.error(`Error occured during queryNFTsbyCollectionAddress: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryNFTsbyCollectionAddress: ${err.message}`
    });
  }
};

const createNFT = async (req: Request, res: Response) => {
  const nftData = req.body.data;
  const apiKey = req.query.API_KEY as string;
  const { userId, device } = req.body;
  const accessToken = accessTokenValidator(req.headers);

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  if (!nftData.nftId || !nftData.tokenId) {
    return res.json({
      success: false,
      message: `Validation Error: nftId and tokenId must exist.`
    });
  }
  if (!nftData.hasOwnProperty('isMinted')) {
    nftData.isMinted = false;
  }

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

  try {
    const nft = new NFT(nftData);
    nft.scanCount = 0;
    nft.viewCount = 0;

    const response = await putNFT(nft);

    return res.json({
      success: true,
      data: response.makeObject()
    });
  } catch (err: any) {
    logger.error(`Error occured during createNFT: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during createNFT: ${err.message}`
    });
  }
};

const createNFTs = async (req: Request, res: Response) => {};

// get user owned NFTs by collection address + tokenId pairs
const queryNFTSByCollectionAddressesAndTokenIds = async (req: Request, res: Response) => {
  const apiKey = req.query.API_KEY as string;
  let queryParams = req.query.QUERY_PARAMS as any;

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  if (!queryParams) {
    return res.json({
      success: false,
      message: `Validation Error: QUERY_PARAMS must be provided.`
    });
  }

  try {
    const { addressesAndTokenIds } = JSON.parse(queryParams);
    addressesAndTokenIds.forEach((keys: NFTIdentifier) => {
      keys.tokenId = Number(keys.tokenId);
    });

    let results = await Promise.all(
      addressesAndTokenIds.map((keys: NFTIdentifier) =>
        getNFTbyCollectionAddressAndTokenId(keys.collectionAddress, keys.tokenId)
      )
    );
    results = results.filter((nft: NFT) => nft.hasOwnProperty('nftId'));

    return res.json({
      success: true,
      data: results
    });
  } catch (err: any) {
    logger.error(`Error occured during queryNFTSByCollectionAddressesAndTokenIds: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryNFTSByCollectionAddressesAndTokenIds: ${err.message}`
    });
  }
};

export {
  queryNFT,
  queryNFTbyDotId,
  queryNFTsbyCollectionId,
  queryNFTsbyCollectionAddress,
  queryNFTSByCollectionAddressesAndTokenIds,
  createNFT,
  createNFTs
};
