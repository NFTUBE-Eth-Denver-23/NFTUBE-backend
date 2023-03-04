export class Asset {
  assetId!: string;
  nftId!: string;
  assetType!: string;
  assetURL!: string;
  creatorAddress!: string;
  creatorId!: string;
  ipfsHash!: string;
  visibility!: boolean;
  processed!: number;
  ipfsURL!: string; // implemented for hackathon. should be deprecated
  appId?: string;

  constructor(assetData: object = {}) {
    Object.assign(this, assetData);
  }

  public makeObject() {
    return {
      assetId: this.assetId,
      nftId: this.nftId,
      creatorId: this.creatorId,
      creatorAddress: this.creatorAddress,
      assetType: this.assetType,
      assetURL: this.assetURL,
      visibility: this.visibility,
      processed: this.processed,
      ipfsHash: this.ipfsHash,
      ipfsURL: this.ipfsURL, // from nft storage
      appId: this.appId
    };
  }
}
