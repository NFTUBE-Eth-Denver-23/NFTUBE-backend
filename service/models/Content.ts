export class Content {
  hashId!: string;
  title!: string;
  number!: number;
  imageUrl!: string;
  description!: string;
  category!: string;
  assetContractAddress!: string;
  ownerAddress!: string;
  owner!: string;
  creatorAddress!: string;
  creator!: string;
  likes!: number;
  price!: number;
  dateTime!: string;

  constructor(assetData: object = {}) {
    Object.assign(this, assetData);
  }

  makeObject(): object {
    return {
      hashId: this.hashId,
      title: this.title,
      number: this.number,
      imageUrl: this.imageUrl,
      description: this.description,
      category: this.category,
      assetContractAddress: this.assetContractAddress,
      ownerAddress: this.ownerAddress,
      owner: this.owner,
      creatorAddress: this.creatorAddress,
      creator: this.creator,
      likes: this.likes,
      price: this.price,
      dateTime: this.dateTime
    };
  }
}
