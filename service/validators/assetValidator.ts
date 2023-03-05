import AssetInfo from '../models/AssetInfo';

const assetInfoListValidator = (assetInfoList: any) => {
  assetInfoList.forEach((assetInfo: any) => {
    if (!validateAssetInfo(assetInfo)) return false;
  });

  return true;
};

const validateAssetInfo = (assetInfo: any) => {
  if (!assetInfo.assetURL || !assetInfo.assetType) {
    return false;
  }
  return true;
};

export { assetInfoListValidator, validateAssetInfo };
