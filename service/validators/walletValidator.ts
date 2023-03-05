import { ethers } from 'ethers';
export type walletValidationParam = {
  signature: string;
  address: string;
  value: string;
  chainId: number;
};
export const walletValidator = (param: walletValidationParam) => {
  const { signature, address, chainId, value: userId } = param;

  const domain = {
    name: 'Unic-Wallet',
    version: '1',
    chainId
  };

  const types = {
    identity: [{ name: 'userId', type: 'string' }]
  };

  const value = {
    userId
  };

  const verifiedAddress = ethers.utils.verifyTypedData(domain, types, value, signature);

  return address === verifiedAddress;
};
