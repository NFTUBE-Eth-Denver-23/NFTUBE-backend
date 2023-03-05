import { Client } from '@elastic/elasticsearch';
import config from '../../config.json';
import logger from '../../logger';

import { Collection } from '../models/Collection';

const esClient = new Client({
  // ES endpoint
  node: config.elasticSearchBetaNode,
  auth: {
    //Kibana master account
    username: config.elasticSearchBetaUsername,
    password: config.elasticSearchBetaPassword
  },
  maxRetries: 5,
  requestTimeout: 60000
});

const collectionIndex = {
  index: 'collection',
  primaryKey: 'collectionId'
};

async function findCollections(keyword: string): Promise<Collection[]> {
  try {
    const response = await esClient.search<any>({
      index: collectionIndex.index,
      body: {
        query: {
          bool: {
            should: {
              multi_match: {
                query: keyword,
                type: 'phrase_prefix',
                fields: ['name', 'description', 'creatorAddress']
              }
            }
          }
        }
      }
    });
    const collections = response.body.hits?.hits.map((hit: any) => {
      return hit._source;
    });
    return collections;
  } catch (error: any) {
    logger.error(`Error occured during ElasticSearch find: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}

export { findCollections };
