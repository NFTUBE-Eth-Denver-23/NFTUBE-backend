import { Request, Response } from 'express';
import {
  COLLECTIONS_TABLE,
  getMostRecentCollection,
  getCollectionsByCategory,
  getCollectionsByCreatorAddress,
  putCollection,
  getCollectionByAddress,
  scanTable,
  getNFTsByCollectionId,
  likeCollection,
  unlikeCollection,
  getUserLikedCollections,
  getUserLikedCollection,
  getWalletsByUserIdAndChain
} from '../providers/ddbProvider';
import { verifyJWTToken } from '../providers/cognitoProvider';
import { validateAPIKey } from '../validators/apiKeyValidator';
import { accessTokenValidator } from '../validators/accessTokenValidator';
import { Collection } from '../models/Collection';
import _ from 'lodash';
import logger from '../../logger';
import { NFT } from '../models/NFT';

const queryCollection = async (req: Request, res: Response) => {
  const collectionId = req.params.collectionId;

  try {
    const collection = await getMostRecentCollection(collectionId);

    return res.json({
      success: true,
      data: collection
    });
  } catch (err: any) {
    logger.error(`Error occured during queryCollection: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryCollection: ${err.message}`
    });
  }
};

const queryCollectionByAddress = async (req: Request, res: Response) => {
  const address = req.params.address;

  try {
    const collection = await getCollectionByAddress(address);

    return res.json({
      success: true,
      data: collection
    });
  } catch (err: any) {
    logger.error(`Error occured during queryCollection: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryCollection: ${err.message}`
    });
  }
};

const queryCollectionsByAddresses = async (req: Request, res: Response) => {
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

  queryParams = JSON.parse(queryParams);

  if (!(queryParams.addresses instanceof Array)) {
    return res.json({
      success: false,
      message: `Validation Error: "address" parameter should be instance of Array`
    });
  }

  try {
    const { addresses } = queryParams;
    let collections = await Promise.all(addresses.map((address: string) => getCollectionByAddress(address)));

    collections = collections.filter((collection: Collection) => {
      return collection.isListed && collection.isLatest;
    });

    return res.json({
      success: true,
      data: collections
    });
  } catch (err: any) {
    logger.error(`Error occured during queryCollectionsByAddresses: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryCollectionsByAddresses: ${err.message}`
    });
  }
};

const queryCollections = async (req: Request, res: Response) => {
  const apiKey = req.query.API_KEY as string;
  let queryParams = req.query.QUERY_PARAMS as any;
  let accessToken = accessTokenValidator(req.headers);

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

  queryParams = JSON.parse(queryParams);

  if (queryParams.hasOwnProperty('userId') && accessToken) {
    const { userId } = queryParams;

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
  }

  const isCreatedByNFTube = queryParams.isCreatedByNFTube;
  const category = queryParams.category;
  const creatorAddress = queryParams.creatorAddress;
  const filterTestOverride = queryParams.filterTestOverride;
  const chain = queryParams.chain as string;

  if (!category && !creatorAddress) {
    return res.json({
      success: false,
      message: `Validation Error: either category or creatorAddress must be provided.`
    });
  }

  try {
    let results: Collection[] = [];

    if (category) {
      if (category === 'all') {
        results = await scanTable(COLLECTIONS_TABLE);
      } else {
        results = await getCollectionsByCategory(category);
      }

      if (creatorAddress) {
        results = results.filter((collection: Collection) => {
          return collection.creatorAddress === creatorAddress;
        });
      }
    } else if (!category && creatorAddress) {
      results = await getCollectionsByCreatorAddress(creatorAddress);
    }

    if (accessToken && queryParams.userId) {
      const { userId } = queryParams;
      results = results.filter((collection: Collection) => {
        if (collection.creatorAddress === userId) {
          return true;
        }
        return collection.isListed;
      });
    } else {
      results = results.filter((collection: Collection) => {
        return collection.isListed;
      });
    }

    if (isCreatedByNFTube) {
      results = results.filter((collection: Collection) => {
        return collection.isCreatedByNFTube;
      });
    }

    if (!filterTestOverride) {
      results = results.filter((c: Collection) => !c.category?.includes('test'));
    }

    if (chain) {
      results = results.filter((c: Collection) => c.chain === chain);
    }

    return res.json({
      success: true,
      data: results
    });
  } catch (err: any) {
    logger.error(`Error occured during queryCollections: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryCollections: ${err.message}`
    });
  }
};

const createCollection = async (req: Request, res: Response) => {
  const collectionData = req.body.data;
  const { userId, appId, device } = req.body;
  const apiKey = req.query.API_KEY as string;
  let accessToken = accessTokenValidator(req.headers);

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

  if (!collectionData.hasOwnProperty('shippingRequired')) {
    collectionData.shippingRequired = false;
  }
  if (!collectionData.hasOwnProperty('ownerSignatureMintAllowed')) {
    collectionData.ownerSignatureMintAllowed = true;
  }

  try {
    if (appId) {
      collectionData['appId'] = appId;
    }
    const collection = new Collection(collectionData);
    collection.version = 1;
    collection.createdAt = Date.now();
    collection.updatedAt = Date.now();
    collection.isLatest = true;

    const response = await putCollection(collection);

    return res.json({
      success: true,
      data: response.makeObject()
    });
  } catch (err: any) {
    logger.error(`Error occured during createCollection: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during createCollection: ${err.message}`
    });
  }
};

const queryCollectionScanAndViewCount = async (req: Request, res: Response) => {
  const collectionId = req.params.collectionId;

  try {
    const relevantNFTs = await getNFTsByCollectionId(collectionId);

    let totalScanCount = 0,
      totalViewCount = 0;

    relevantNFTs.forEach((nft: NFT) => {
      totalScanCount = totalScanCount + (nft.scanCount || 0);
      totalViewCount = totalViewCount + (nft.viewCount || 0);
    });

    return res.json({
      success: true,
      data: { totalScanCount: totalScanCount, totalViewCount: totalViewCount }
    });
  } catch (err: any) {
    logger.error(`Error occured during queryCollection: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryCollection: ${err.message}`
    });
  }
};

const collectionLikeAction = async (req: Request, res: Response) => {
  const collectionId = req.params.collectionId;
  const userId = req.params.userId;
  const apiKey = req.query.API_KEY as string;
  const { device } = req.body;
  let accessToken = accessTokenValidator(req.headers);

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  if (!collectionId || !userId) {
    return res.json({
      success: false,
      message: `Validation Error: collectionId and userId must be present.`
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
    await likeCollection(collectionId, userId);

    return res.json({
      success: true
    });
  } catch (err: any) {
    logger.error(`Error occured during collectionLikeAction for ${collectionId} / ${userId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during collectionLikeAction: ${err.message}`
    });
  }
};

const collectionUnlikeAction = async (req: Request, res: Response) => {
  const collectionId = req.params.collectionId;
  const userId = req.params.userId;
  const apiKey = req.query.API_KEY as string;
  const { device } = req.body;
  let accessToken = accessTokenValidator(req.headers);

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  if (!collectionId || !userId) {
    return res.json({
      success: false,
      message: `Validation Error: collectionId and userId must be present.`
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
    await unlikeCollection(collectionId, userId);

    return res.json({
      success: true
    });
  } catch (err: any) {
    logger.error(`Error occured during collectionUnlikeAction for ${collectionId} / ${userId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during collectionUnlikeAction: ${err.message}`
    });
  }
};

const queryCollectionUserRelation = async (req: Request, res: Response) => {
  const collectionId = req.params.collectionId;
  const userId = req.params.userId;
  const apiKey = req.query.API_KEY as string;

  if (!validateAPIKey(apiKey)) {
    return res.json({
      success: false,
      message: `Validation Error: Invalid API Key.`
    });
  }

  if (!collectionId || !userId) {
    return res.json({
      success: false,
      message: `Validation Error: collectionId and userId must be present.`
    });
  }

  try {
    const relation = { isLiked: false };
    const likedCollection = await getUserLikedCollection(collectionId, userId);

    if (likedCollection && likedCollection.collectionId && likedCollection.userId) {
      relation.isLiked = true;
    }

    return res.json({
      success: true,
      data: relation
    });
  } catch (err: any) {
    logger.error(`Error occured during queryNFTUserRelation for ${collectionId} / ${userId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryNFTUserRelation: ${err.message}`
    });
  }
};

const queryUserLikedCollections = async (req: Request, res: Response) => {
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
    const userLikedCollections = await getUserLikedCollections(userId);
    let results: Collection[] = [];

    results = await Promise.all(
      userLikedCollections.map((record: any) => getMostRecentCollection(record.collectionId))
    );

    results = results.filter((collection: Collection) => {
      return collection.isListed;
    });

    if (chain) {
      results = results.filter((collection: Collection) => {
        return collection.chain === chain;
      });
    }

    return res.json({
      success: true,
      data: results
    });
  } catch (err: any) {
    logger.error(`Error occured during queryUserLikedCollections for ${userId}: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during queryUserLikedCollections: ${err.message}`
    });
  }
};

export {
  collectionLikeAction,
  collectionUnlikeAction,
  queryUserLikedCollections,
  queryCollection,
  queryCollectionByAddress,
  queryCollectionsByAddresses,
  queryCollections,
  createCollection,
  queryCollectionScanAndViewCount,
  queryCollectionUserRelation
};
