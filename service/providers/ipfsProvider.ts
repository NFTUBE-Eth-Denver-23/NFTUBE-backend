import axios from 'axios';
import config from '../../config.json';
import logger from '../../logger';
import { NFTStorage, File } from 'nft.storage';
const NFT_STORAGE_TOKEN = config.nftStorageAPIKey;
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

// implemented temporaily for hackathon purpose. should not be used.
const storeBlobToNFTStorage = async (binaryData: Buffer, assetId: string, contentType: string, nftId: string) => {
  const imageFile = new File([binaryData], `${assetId}.${contentType.split('/')[1]}`, { type: contentType });
  const token = await client.store({
    name: `Asset data for ${nftId}`,
    description: `Asset data created for ${nftId} by `,
    image: imageFile
  });
  logger.debug(`storeBlobToNFTStorage through NFT Storage complete: ${token}`);
  return token;
};

const pinFileToIPFS = async (formData: any): Promise<any> => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const fileRes = await axios.post(url, formData, {
    maxBodyLength: Infinity,
    headers: {
      // formData.getBoundary() is specific to npm package. native javascript FormData does not have this method
      'Content-Type': `multipart/form-data: boundary=${formData.getBoundary()}`,
      pinata_api_key: config.pinataAPIKey,
      pinata_secret_api_key: config.pinataAPISecret
    }
  });

  logger.debug(`pinFileToIPFS through Pinata complete: ${fileRes.data.IpfsHash}`);
  return fileRes.data;
};

const pinJSONtoIPFS = async (data: any) => {
  let pinataConfig = {
    method: 'post',
    url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    headers: {
      'Content-Type': 'application/json',
      Authorization: config.pinataJWT
    },
    data: data
  };

  const res = await axios(pinataConfig);

  logger.debug(`pinJSONtoIPFS through Pinata complete: ${res.data.IpfsHash}`);
  return res.data;
};

export { pinJSONtoIPFS, pinFileToIPFS, storeBlobToNFTStorage };
