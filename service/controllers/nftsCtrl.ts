import { Request, Response } from 'express';
import { validateAPIKey } from '../validators/apiKeyValidator';
import { accessTokenValidator } from '../validators/accessTokenValidator';
import {
  atomicIncrementNFTScanCount,
  atomicIncrementNFTViewCount,
  getNFT,
  getNFTbyDotId,
  getNFTsByCollectionId,
  getNFTsByCollectionAddress,
  getNFTbyCollectionAddressAndTokenId,
  putNFT,
  likeNFT,
  unlikeNFT,
  getUserLikedNFT,
  getUserLikedNFTs,
  getWalletsByUserIdAndChain
} from '../providers/ddbProvider';
import { createAsset } from './assetsCtrl';
import { uploadMetadata } from '../providers/s3Provider';
import { NFT } from '../models/NFT';
import { NFTIdentifier } from '../interfaces/NFTIdentifier';
import { NFTUpdateItems } from '../interfaces/NFTUpdateItems';

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

const createAssetsAndSaveNfts = async (req: Request, res: Response) => {
  const assetsAndNFTs = req.body.data;
  const apiKey = req.query.API_KEY as string;
  const { userId, signature, maxTokenId, appId, device } = req.body;
  const accessToken = accessTokenValidator(req.headers);

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  if (!assetsAndNFTs || !assetsAndNFTs.length) {
    return res.json({
      success: false,
      message: `Validation Error: Assets and NFTs data not supplied.`
    });
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
  if (signature || maxTokenId) {
    if (!signature || !maxTokenId) {
      return res.json({
        success: false,
        message: `Validation Error: Signature & maxTokenId must be provided together.`
      });
    }
  }

  try {
    for (const data of assetsAndNFTs) {
      const { nftData, assets, traits, assetCreatorAddress, skipMetadataUpload, assetCreatorId } = data;

      if (!nftData.hasOwnProperty('isMinted')) {
        nftData.isMinted = false;
      }
      if (!nftData.hasOwnProperty('isNFTImageScannable')) {
        nftData.isNFTImageScannable = false;
      }
      if (signature && typeof maxTokenId === 'number') {
        nftData.signature = signature;
        nftData.maxTokenId = maxTokenId;
      }
      if (appId) {
        nftData.appId = appId;
      }
      const nft = new NFT(nftData);
      nft.scanCount = 0;
      nft.viewCount = 0;

      await putNFT(nft);

      let metadata = {
        name: nft.name,
        description: nft.description,
        image: nft.imageURL,
        traits: traits
      };

      if (!skipMetadataUpload) {
        await uploadMetadata(nft.creatorAddress, nft.collectionId, nft.tokenId, metadata);
      }

      await Promise.all(
        assets.map((asset: any) => createAsset(asset, nft.nftId, assetCreatorAddress, assetCreatorId, appId))
      );
    }

    return res.json({
      success: true,
      message: 'Successfully genreated assets and NFTs.'
    });
  } catch (err: any) {
    logger.error(`Error occured during createAssetsAndSaveNfts: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during createAssetsAndSaveNfts: ${err.message}`
    });
  }
};

const incrementNFTScanCount = async (req: Request, res: Response) => {
  const nftId = req.params.nftId;
  const apiKey = req.query.API_KEY as string;
  const { userId, device } = req.body;
  const accessToken = accessTokenValidator(req.headers);

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
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

  if (!nftId) {
    return res.json({
      success: false,
      message: `Validation Error: NFT ID not provided.`
    });
  }

  try {
    await atomicIncrementNFTScanCount(nftId);

    return res.json({
      success: true
    });
  } catch (err: any) {
    logger.error(`Error occured during incrementNFTScanCount for ${nftId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during incrementNFTScanCount: ${err.message}`
    });
  }
};

const incrementNFTViewCount = async (req: Request, res: Response) => {
  const nftId = req.params.nftId;
  const apiKey = req.query.API_KEY as string;
  const { userId, device } = req.body;
  const accessToken = accessTokenValidator(req.headers);

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
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
    await atomicIncrementNFTViewCount(nftId);

    return res.json({
      success: true
    });
  } catch (err: any) {
    logger.error(`Error occured during incrementNFTViewCount for ${nftId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during incrementNFTViewCount: ${err.message}`
    });
  }
};

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

const NFTLikeAction = async (req: Request, res: Response) => {
  const nftId = req.params.nftId;
  const userId = req.params.userId;
  const apiKey = req.query.API_KEY as string;
  const { device } = req.body;
  const accessToken = accessTokenValidator(req.headers);

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  if (!nftId || !userId) {
    return res.json({
      success: false,
      message: `Validation Error: nftId and userId must be present.`
    });
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
    await likeNFT(nftId, userId);

    return res.json({
      success: true
    });
  } catch (err: any) {
    logger.error(`Error occured during NFTLikeAction for ${nftId} / ${userId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during NFTLikeAction: ${err.message}`
    });
  }
};

const queryNFTUserRelation = async (req: Request, res: Response) => {
  const nftId = req.params.nftId;
  const userId = req.params.userId;
  const apiKey = req.query.API_KEY as string;

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  if (!nftId || !userId) {
    return res.json({
      success: false,
      message: `Validation Error: nftId and userId must be present.`
    });
  }

  try {
    const relation = { isLiked: false };
    const likedNFT = await getUserLikedNFT(nftId, userId);

    if (likedNFT && likedNFT.nftId && likedNFT.userId) {
      relation.isLiked = true;
    }

    return res.json({
      success: true,
      data: relation
    });
  } catch (err: any) {
    logger.error(`Error occured during queryNFTUserRelation for ${nftId} / ${userId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryNFTUserRelation: ${err.message}`
    });
  }
};

const NFTUnlikeAction = async (req: Request, res: Response) => {
  const nftId = req.params.nftId;
  const userId = req.params.userId;
  const apiKey = req.query.API_KEY as string;
  const { device } = req.body;
  const accessToken = accessTokenValidator(req.headers);

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  if (!nftId || !userId) {
    return res.json({
      success: false,
      message: `Validation Error: nftId and userId must be present.`
    });
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
    await unlikeNFT(nftId, userId);

    return res.json({
      success: true
    });
  } catch (err: any) {
    logger.error(`Error occured during NFTUnlikeAction for ${nftId} / ${userId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during NFTUnlikeAction: ${err.message}`
    });
  }
};

const queryUserLikedNFTs = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const chain = req.params.chain;
  const apiKey = req.query.API_KEY as string;

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  try {
    const userLikedNFTs = await getUserLikedNFTs(userId);
    let results: NFT[] = [];
    results = await Promise.all(userLikedNFTs.map((record: any) => getNFT(record.nftId)));

    if (chain) {
      results = results.filter((nft: NFT) => {
        return nft.chain === chain;
      });
    }

    return res.json({
      success: true,
      data: results
    });
  } catch (err: any) {
    logger.error(`Error occured during queryUserLikedNFTs for ${userId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryUserLikedNFTs: ${err.message}`
    });
  }
};

const queryNFTCountByCollectionId = async (req: Request, res: Response) => {
  const collectionId = req.params.collectionId;
  const apiKey = req.query.API_KEY as string;

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }
  if (!collectionId) {
    return res.json({
      success: false,
      message: 'Validation Error: collectionId must be presented'
    });
  }

  try {
    const nfts = await getNFTsByCollectionId(collectionId);

    return res.json({
      success: true,
      data: nfts.length
    });
  } catch (err: any) {
    logger.error(`Error occured during queryNFTCountByCollectionId for ${collectionId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryNFTCountByCollectionId: ${err.message}`
    });
  }
};

export {
  NFTLikeAction,
  NFTUnlikeAction,
  queryUserLikedNFTs,
  queryNFT,
  queryNFTbyDotId,
  queryNFTsbyCollectionId,
  queryNFTsbyCollectionAddress,
  queryNFTSByCollectionAddressesAndTokenIds,
  createNFT,
  createNFTs,
  createAssetsAndSaveNfts,
  incrementNFTScanCount,
  incrementNFTViewCount,
  queryNFTUserRelation,
  queryNFTCountByCollectionId
};
