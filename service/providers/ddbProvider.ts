import AWS from 'aws-sdk';
import { User } from '../models/User';
import { Collection } from '../models/Collection';
import { Content } from '../models/Content';
import config from '../../config.json';
import { String } from 'aws-sdk/clients/batch';
import { ScanInput } from 'aws-sdk/clients/dynamodb';
import { SuccessResponse } from '../interfaces/common';
import { NFT } from '../models/NFT';

let USERS_TABLE = 'usersTableBeta';
let CONTENTS_TABLE = 'contentsTableBeta';
let COLLECTIONS_TABLE = 'collectionsTableBeta';
let NFTS_TABLE = 'nftsTableBeta';
let ASSETS_TABLE = 'assetsTableBeta';

const ADDRESS_INDEX = 'address-index';
const CATEGORY_INDEX = 'category-index';
const CREATOR_ADDRESS_INDEX = 'creatorAddress-index';
const USER_ID_INDEX = 'userId-index';
const COLLECTION_ADDRESS_INDEX = 'collectionAddress-index';
const DOT_ID_INDEX = 'dotId-index';
const COLLECTION_ADDRESS_TOKEN_ID_INDEX = 'collectionAddress-tokenId-index';
const COLLECTION_ID_INDEX = 'collectionId-index';
AWS.config.update({
  accessKeyId: config.nftubeAccessKey,
  secretAccessKey: config.nftubeSecretKey,
  region: config.defaultRegion
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient({
  region: config.defaultRegion,
  service: dynamodb,
  convertEmptyValues: true
});

const scanTable = async (tableName: string): Promise<any> => {
  const params: ScanInput = {
    TableName: tableName
  };

  const scanResults: AWS.DynamoDB.DocumentClient.AttributeMap[] = [];
  let items;
  do {
    items = await docClient.scan(params).promise();
    items?.Items?.forEach((item) => scanResults.push(item));
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== 'undefined');

  return scanResults;
};

const getContentsByCategory = async (category: string): Promise<any> => {
  const params = {
    TableName: CONTENTS_TABLE,
    IndexName: CATEGORY_INDEX,
    KeyConditionExpression: 'category = :category',
    ExpressionAttributeValues: {
      ':category': category
    }
  };
  const response = await docClient.query(params).promise();
  return response.Items;
};

const putContent = async (content: Content): Promise<Content> => {
  const params = {
    TableName: CONTENTS_TABLE,
    Item: content.makeObject()
  };

  await docClient.put(params).promise();

  return content;
};

const deleteContentByHashId = async (hashId: string) => {
  const params = {
    TableName: CONTENTS_TABLE,
    Key: {
      hashId: hashId
    }
  };

  await docClient.delete(params).promise();
};

const getUserByTag = async (userTag: string): Promise<User> => {
  const params = {
    TableName: USERS_TABLE,
    IndexName: 'userTag-index',
    KeyConditionExpression: `userTag = :userTag`,
    ExpressionAttributeValues: {
      ':userTag': userTag
    }
  };

  const response = await docClient.query(params).promise();
  const userData = response.Items?.[0];

  return new User(userData);
};

const getUser = async (userId: string): Promise<User> => {
  const params = {
    TableName: USERS_TABLE,
    KeyConditionExpression: `userId = :userId`,
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  const response = await docClient.query(params).promise();
  const userData = response.Items?.[0];

  return new User(userData);
};

const putUser = async (user: User): Promise<User> => {
  const params = {
    TableName: USERS_TABLE,
    Item: user.makeObject()
  };

  await docClient.put(params).promise();

  return user;
};

// for now only used for testing purpose
const deleteUser = async (userId: string): Promise<void> => {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: userId
    }
  };

  await docClient.delete(params).promise();
};

const getCollectionWithVersion = async (collectionId: string, version: number): Promise<Collection> => {
  const params = {
    TableName: COLLECTIONS_TABLE,
    KeyConditionExpression: `collectionId = :collectionId and version = :version`,
    ExpressionAttributeValues: {
      ':collectionId': collectionId,
      ':version': version
    }
  };

  const response = await docClient.query(params).promise();
  const collectionData = response.Items?.[0];

  return new Collection(collectionData);
};

const getCollectionByAddress = async (address: string): Promise<Collection> => {
  const params = {
    TableName: COLLECTIONS_TABLE,
    IndexName: ADDRESS_INDEX,
    KeyConditionExpression: `address = :address`,
    ExpressionAttributeValues: {
      ':address': address
    }
  };
  const response = await docClient.query(params).promise();
  const items = response.Items;

  if (items?.length) {
    const sorted = items.sort((a, b) => b.version - a.version);
    return new Collection(sorted[0]);
  } else {
    return new Collection();
  }
};

const getMostRecentCollection = async (collectionId: string): Promise<Collection> => {
  const params = {
    TableName: COLLECTIONS_TABLE,
    KeyConditionExpression: `collectionId = :collectionId`,
    ExpressionAttributeValues: {
      ':collectionId': collectionId
    }
  };
  const response = await docClient.query(params).promise();
  const items = response.Items;
  if (items?.length) {
    const sorted = items.sort((a, b) => b.version - a.version);
    return new Collection(sorted[0]);
  } else {
    return new Collection();
  }
};

const getCollectionsByCategory = async (category: string): Promise<Collection[]> => {
  const params = {
    TableName: COLLECTIONS_TABLE,
    IndexName: CATEGORY_INDEX,
    KeyConditionExpression: `category = :category`,
    ExpressionAttributeValues: {
      ':category': category
    }
  };

  const response = await docClient.query(params).promise();
  return response.Items as Collection[];
};

const getCollectionsByCreatorAddress = async (creatorAddress: string): Promise<Collection[]> => {
  const params = {
    TableName: COLLECTIONS_TABLE,
    IndexName: CREATOR_ADDRESS_INDEX,
    KeyConditionExpression: `creatorAddress = :creatorAddress`,
    ExpressionAttributeValues: {
      ':creatorAddress': creatorAddress
    }
  };

  const response = await docClient.query(params).promise();
  return response.Items as Collection[];
};

// for now only used for testing purpose
const deleteCollection = async (collectionId: string, version: number): Promise<void> => {
  const params = {
    TableName: COLLECTIONS_TABLE,
    Key: {
      collectionId: collectionId,
      version: version
    }
  };

  await docClient.delete(params).promise();
};

const getNFT = async (nftId: string): Promise<NFT> => {
  const params = {
    TableName: NFTS_TABLE,
    KeyConditionExpression: `nftId = :nftId`,
    ExpressionAttributeValues: {
      ':nftId': nftId
    }
  };

  const response = await docClient.query(params).promise();
  const nftData = response.Items?.[0];

  return new NFT(nftData);
};
const putCollection = async (collection: Collection): Promise<Collection> => {
  const params = {
    TableName: COLLECTIONS_TABLE,
    Item: collection.makeObject()
  };

  await docClient.put(params).promise();

  return collection;
};

const getNFTbyDotId = async (dotId: String): Promise<NFT> => {
  const params = {
    TableName: NFTS_TABLE,
    IndexName: DOT_ID_INDEX,
    KeyConditionExpression: `dotId = :dotId`,
    ExpressionAttributeValues: {
      ':dotId': dotId
    }
  };

  const response = await docClient.query(params).promise();
  const nftData = response.Items?.[0];

  return new NFT(nftData);
};

const getNFTsByCollectionId = async (collectionId: string): Promise<any> => {
  const params = {
    TableName: NFTS_TABLE,
    IndexName: COLLECTION_ID_INDEX,
    KeyConditionExpression: `collectionId = :collectionId`,
    ExpressionAttributeValues: {
      ':collectionId': collectionId
    }
  };

  const response = await docClient.query(params).promise();
  return response.Items;
};

const getNFTbyCollectionAddressAndTokenId = async (collectionAddress: string, tokenId: number): Promise<NFT> => {
  const params = {
    TableName: NFTS_TABLE,
    IndexName: COLLECTION_ADDRESS_TOKEN_ID_INDEX,
    KeyConditionExpression: `collectionAddress = :collectionAddress and tokenId = :tokenId`,
    ExpressionAttributeValues: {
      ':collectionAddress': collectionAddress,
      ':tokenId': tokenId
    }
  };

  const response = await docClient.query(params).promise();
  const nftData = response.Items?.[0];

  return new NFT(nftData);
};

const getNFTsByCollectionAddress = async (collectionAddress: string): Promise<any> => {
  const params = {
    TableName: NFTS_TABLE,
    IndexName: COLLECTION_ADDRESS_INDEX,
    KeyConditionExpression: `collectionAddress = :collectionAddress`,
    ExpressionAttributeValues: {
      ':collectionAddress': collectionAddress
    }
  };

  const response = await docClient.query(params).promise();
  return response.Items;
};

const putNFT = async (nft: NFT): Promise<NFT> => {
  const params = {
    TableName: NFTS_TABLE,
    Item: nft.makeObject()
  };

  await docClient.put(params).promise();

  return nft;
};

export {
  COLLECTIONS_TABLE,
  scanTable,
  getContentsByCategory,
  putContent,
  deleteContentByHashId,
  putUser,
  getUser,
  getUserByTag,
  deleteUser,
  getCollectionWithVersion,
  getMostRecentCollection,
  getCollectionsByCategory,
  getCollectionByAddress,
  deleteCollection,
  putCollection,
  getCollectionsByCreatorAddress,
  getNFT,
  putNFT,
  getNFTbyDotId,
  getNFTsByCollectionId,
  getNFTbyCollectionAddressAndTokenId,
  getNFTsByCollectionAddress
};
