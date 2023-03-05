import { Request, Response } from 'express';
import { findCollections } from '../providers/elasticSearchProvider';
import { Collection } from '../models/Collection';
import { validateAPIKey } from '../validators/apiKeyValidator';
import logger from '../../logger';

const searchCollections = async (req: Request, res: Response) => {
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
    const { keyword, filterTestOverride, chain, category } = JSON.parse(queryParams);

    let collections = await findCollections(keyword);

    collections = collections.filter((collection: Collection) => collection.isListed);
    collections = collections.filter((collection: Collection) => collection.isLatest);
    if (chain) {
      collections = collections.filter((collection: Collection) => collection.chain === chain);
    }
    if (category) {
      collections = collections.filter((collection: Collection) =>
        category === 'all' ? true : collection.category === category
      );
    }
    if (!filterTestOverride) {
      collections = collections.filter((collection: Collection) => !collection.category?.includes('test'));
    }

    return res.json({
      success: true,
      data: collections
    });
  } catch (err: any) {
    logger.error(`Error occured during searchCollections: ${err.message}`);
    logger.error(err.stack);

    return res.json({
      success: false,
      message: `Error occured during searchCollections: ${err.message}`
    });
  }
};

export { searchCollections };
