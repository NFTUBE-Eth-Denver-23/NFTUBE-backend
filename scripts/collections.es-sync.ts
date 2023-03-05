import { Client } from '@elastic/elasticsearch';
import { scanTable, COLLECTIONS_TABLE } from '../service/providers/ddbProvider';
import config from '../config.json';
import { Collection, Collections } from '../service/models/Collection';
import logger from '../logger';

const client = new Client({
  node: config.elasticSearchBetaNode,
  auth: {
    username: config.elasticSearchBetaUsername,
    password: config.elasticSearchBetaPassword
  }
});
const dataConfig: any = {
  index: 'collection',
  primaryKey: 'collectionId'
};

(async function () {
  try {
    let collections: Collections = await scanTable(COLLECTIONS_TABLE);
    collections = collections.filter((collection: Collection) => collection.isLatest);

    await Promise.all(
      collections?.map((collection) => {
        return _insertData(collection, dataConfig, client);
      })
    );
  } catch (error) {
    logger.error('While executing collection.sync.ts...', error);
  }
})();

async function _insertData(data: Collection, config: any, client: Client) {
  const { index } = config;
  const id = data.collectionId;
  return await client.index({
    id,
    index,
    body: data
  });
}
