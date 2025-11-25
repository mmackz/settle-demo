export const boostCoreAbi = [
  {
    inputs: [
      { internalType: 'uint256', name: 'boostId_', type: 'uint256' },
      { internalType: 'uint256', name: 'incentiveId_', type: 'uint256' },
      { internalType: 'address', name: 'referrer_', type: 'address' },
      { internalType: 'bytes', name: 'data_', type: 'bytes' },
      { internalType: 'address', name: 'claimant', type: 'address' },
    ],
    name: 'claimIncentiveFor',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
