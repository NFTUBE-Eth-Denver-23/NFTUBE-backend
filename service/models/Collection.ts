export type Collections = Collection[] | [];
export class Collection {
  collectionId!: string;
  address!: string;
  creatorAddress!: string;
  name!: string;
  description!: string;
  category!: string;
  coverPhoto!: string;
  mainPhoto!: string;
  chain!: string;
  standard!: string;
  isListed!: boolean;
  status!: string;
  links!: string[];
  version!: number;
  createdAt!: number;
  updatedAt!: number;
  isLatest!: boolean;
  isCreatedByNFTube!: boolean;
  shippingRequired!: boolean;
  ownerSignatureMintAllowed!: boolean;
  appId?: string;

  constructor(collectionData: object = {}) {
    Object.assign(this, collectionData);
  }

  public makeObject() {
    return {
      collectionId: this.collectionId,
      address: this.address,
      creatorAddress: this.creatorAddress,
      name: this.name,
      description: this.description,
      category: this.category,
      coverPhoto: this.coverPhoto,
      mainPhoto: this.mainPhoto,
      chain: this.chain,
      standard: this.standard,
      isListed: this.isListed,
      status: this.status,
      links: this.links,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isLatest: this.isLatest,
      isCreatedByNFTube: this.isCreatedByNFTube,
      shippingRequired: this.shippingRequired,
      ownerSignatureMintAllowed: this.ownerSignatureMintAllowed,
      appId: this.appId
    };
  }
}
