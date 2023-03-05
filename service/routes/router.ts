import { Express, Request, Response, NextFunction } from 'express';
import colors from 'colors';

import { showService } from '../controllers/indexCtrl';
import { queryContents, addContent, deleteContent } from '../controllers/contentsCtrl';
import { createAssets, createPreSignedURL, queryAssetsByNFTId, updateAsset } from '../controllers/assetsCtrl';
import {
  queryRecentWalletByUserIdAndChain,
  queryWalletsByUserIdAndChain,
  saveWallet,
  queryUserByWallet
} from '../controllers/walletsCtrl';
import {
  queryCollection,
  createCollection,
  queryCollections,
  queryCollectionByAddress,
  queryCollectionScanAndViewCount,
  collectionLikeAction,
  collectionUnlikeAction,
  queryUserLikedCollections,
  queryCollectionUserRelation,
  queryCollectionsByAddresses
} from '../controllers/collectionsCtrl';
import {
  queryNFT,
  queryNFTbyDotId,
  queryNFTsbyCollectionId,
  queryNFTsbyCollectionAddress,
  createNFT,
  createNFTs,
  createAssetsAndSaveNfts,
  incrementNFTScanCount,
  incrementNFTViewCount,
  queryNFTSByCollectionAddressesAndTokenIds,
  NFTLikeAction,
  NFTUnlikeAction,
  queryUserLikedNFTs,
  queryNFTUserRelation,
  queryNFTCountByCollectionId
} from '../controllers/nftsCtrl';
import { fetchExternalImageMetadata } from '../controllers/externalCtrl';

import { searchCollections } from '../controllers/searchCtrl';

const initilizeRoutes = (app: Express): void => {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(colors.yellow(new Date().toISOString()));
    next();
  });

  app.route('/').get(showService);

  app.route('/query_assets_by_nft_id/:nftId').get(queryAssetsByNFTId);

  app.route('/save_assets').post(createAssets);

  app.route('/query_wallets_by_user_id_and_chain/:userId/:chain').get(queryWalletsByUserIdAndChain);

  app.route('/query_recent_wallet_by_user_id_and_chain/:userId/:chain').get(queryRecentWalletByUserIdAndChain);

  app.route('/query_user_by_wallet_address/:address/:chain').get(queryUserByWallet);

  app.route('/save_wallet').post(saveWallet).put(saveWallet);
  app.route('/update_asset/:assetId').put(updateAsset);

  app.route('/query_contents/:category').get(queryContents);

  app.route('/add_content').post(addContent);

  app.route('/delete_content/:hashId').delete(deleteContent);

  app.route('/create_pre_signed_url').post(createPreSignedURL);

  app.route('/query_collection/:collectionId').get(queryCollection);

  app.route('/query_collection_by_address/:address').get(queryCollectionByAddress);

  app.route('/query_collections_by_addresses').get(queryCollectionsByAddresses);
  app.route('/query_collections').get(queryCollections);

  app.route('/query_collection_scan_and_view_count/:collectionId').get(queryCollectionScanAndViewCount);

  app.route('/save_collection').post(createCollection);

  app.route('/create_collection_ipfs_url').post();

  app.route('/query_nft/:nftId').get(queryNFT);

  app.route('/query_nft_by_dot_id/:dotId').get(queryNFTbyDotId);

  app.route('/query_nfts_by_collection_id/:collectionId').get(queryNFTsbyCollectionId);

  app.route('/query_nft_count_in_collection_by_id/:collectionId').get(queryNFTCountByCollectionId);

  app.route('/query_nfts_by_collection_address/:collectionAddress').get(queryNFTsbyCollectionAddress);

  app.route('/query_nfts_by_collection_addresses_and_token_ids').get(queryNFTSByCollectionAddressesAndTokenIds);

  app.route('/save_nft').post(createNFT);

  app.route('/save_nfts').post(createNFTs);

  app.route('/increment_nft_scan_count/:nftId').post(incrementNFTScanCount);

  app.route('/increment_nft_view_count/:nftId').post(incrementNFTViewCount);

  app.route('/create_assets_and_save_nfts').post(createAssetsAndSaveNfts);

  app.route('/fetch_external_img_metadata').get(fetchExternalImageMetadata);

  app.route('/like_nft/:nftId/:userId').post(NFTLikeAction);

  app.route('/unlike_nft/:nftId/:userId').post(NFTUnlikeAction);

  app.route('/query_user_liked_nfts/:userId/:chain?').get(queryUserLikedNFTs);

  app.route('/like_collection/:collectionId/:userId').post(collectionLikeAction);

  app.route('/unlike_collection/:collectionId/:userId').post(collectionUnlikeAction);

  app.route('/query_user_liked_collections/:userId/:chain?').get(queryUserLikedCollections);

  app.route('/query_nft_user_relation/:nftId/:userId').get(queryNFTUserRelation);

  app.route('/query_collection_user_relation/:collectionId/:userId').get(queryCollectionUserRelation);

  app.route('/search_collections').get(searchCollections);
};

export { initilizeRoutes };
