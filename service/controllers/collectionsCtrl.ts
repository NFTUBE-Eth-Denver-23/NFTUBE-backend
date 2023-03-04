import { Request, Response } from 'express';
import {
  COLLECTIONS_TABLE,
  getMostRecentCollection,
  getCollectionsByCategory,
  getCollectionsByCreatorAddress,
  getCollectionByAddress,
  putCollection,
  scanTable
} from '../providers/ddbProvider';
import { verifyJWTToken } from '../providers/cognitoProvider';
import { validateAPIKey } from '../validators/apiKeyValidator';
import { accessTokenValidator } from '../validators/accessTokenValidator';
import { Collection } from '../models/Collection';
import _ from 'lodash';
import logger from '../../logger';

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

  const isCreatedByUnic = queryParams.isCreatedByUnic;
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

    if (isCreatedByUnic) {
      results = results.filter((collection: Collection) => {
        return collection.isCreatedByUnic;
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

export { queryCollection, queryCollectionByAddress, queryCollectionsByAddresses, queryCollections, createCollection };
