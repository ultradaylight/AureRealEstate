// src/networks.js

const networks = {
  hardhat: {
    chainId: 31337, // Hardhat local network
    chainName: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#", // PulseChain Mainnet  explorer for local Hardhat
  },
  pulsechainTestnetV4: {
    chainId: 943, // PulseChain Testnet v4 chain ID
    chainName: "PulseChain Testnet v4",
    rpcUrl: "https://rpc.v4.testnet.pulsechain.com",
    nativeCurrency: {
      name: "Pulse",
      symbol: "tPLS",
      decimals: 18,
    },
    blockExplorerUrl: "https://scan.v4.testnet.pulsechain.com/#",
  },
  pulsechainMainnet: {
    chainId: 369, // PulseChain Mainnet chain ID
    chainName: "PulseChain",
    rpcUrl: "https://rpc.pulsechain.com",
    nativeCurrency: {
      name: "Pulse",
      symbol: "PLS",
      decimals: 18,
    },
    blockExplorerUrl: "https://scan.mypinata.cloud/ipfs/bafybeih3olry3is4e4lzm7rus5l3h6zrphcal5a7ayfkhzm5oivjro2cp4/#",
  },
};

// Set the active network here (change this line to switch networks)
const activeNetwork = networks.pulsechainMainnet; 

export { networks, activeNetwork };
