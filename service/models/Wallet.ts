export class Wallet {
  address!: string;
  chain!: string;
  userId!: string;
  connectedTime!: number;
  appId?: string;

  constructor(walletData: object = {}) {
    Object.assign(this, walletData);
  }

  public makeObject() {
    return {
      address: this.address,
      chain: this.chain,
      userId: this.userId,
      connectedTime: this.connectedTime,
      appId: this.appId
    };
  }
}
