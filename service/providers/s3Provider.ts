import AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import config from '../../config.json';
import logger from '../../logger';

AWS.config.update({
  accessKeyId: config.nftubeAccessKey,
  secretAccessKey: config.nftubeSecretKey,
  region: config.defaultRegion
});

const S3 = new AWS.S3();
const ORIGINAL_ASSETS_BUCKET = 'original-assets';
const COLLECTIONS_BUCKET = 'unic-collections';
const SIGNED_URL_EXPIRES_SEC = 60 * 15;

const generatePreSingedURL = async (
  userId: string,
  assetType: string,
  assetId: string,
  fileType: string
): Promise<string> => {
  const url = await new Promise((resolve, reject) => {
    S3.getSignedUrl(
      'putObject',
      {
        Bucket: ORIGINAL_ASSETS_BUCKET,
        Key: `${userId}/${assetType}/${assetId}`,
        ACL: 'public-read',
        ContentType: fileType,
        Expires: SIGNED_URL_EXPIRES_SEC
      },
      (err, url) => {
        err ? reject(err) : resolve(url);
      }
    );
  });

  logger.debug(`generatePreSingedURL complete: ${userId}/${assetType}/${assetId}`);
  return url as string;
};

const uploadMetadata = async (
  creatorAddress: string,
  collectionId: string,
  tokenId: number,
  metadata: object
): Promise<void> => {
  const buf = Buffer.from(JSON.stringify(metadata));
  const params = {
    Bucket: COLLECTIONS_BUCKET,
    Key: `${creatorAddress}/${collectionId}/${tokenId}.json`,
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: 'application/json',
    ACL: 'public-read'
  };

  try {
    const { Location, Key } = await S3.upload(params).promise();
    logger.debug(`uploadMetadata complete: ${Location} - ${Key}`);
  } catch (err) {
    logger.debug(`uploadMetadata failed for: ${creatorAddress}/${collectionId}/${tokenId}/${JSON.stringify(metadata)}`);
    throw err;
  }
};

const getObject = async (bucket: string, objectKey: string): Promise<PromiseResult<any, any>> => {
  const params = {
    Bucket: bucket,
    Key: objectKey
  };

  return await S3.getObject(params).promise();
};

export { generatePreSingedURL, uploadMetadata, getObject };
