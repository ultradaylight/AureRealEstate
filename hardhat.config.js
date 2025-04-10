require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { PRIVATE_KEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    pulseTestnetV4: {
      url: "https://rpc.v4.testnet.pulsechain.com",
      chainId: 943,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    pulsechain: {
      url: "https://rpc.pulsechain.com",
      chainId: 369,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      pulseTestnetV4: "YOUR_PULSESCAN_API_KEY", // Keep this for testnet
    },
    customChains: [
      {
        network: "pulseTestnetV4",
        chainId: 943,
        urls: {
          apiURL: "https://scan.v4.testnet.pulsechain.com/api",
          browserURL: "https://scan.v4.testnet.pulsechain.com",
        },
      },
      
    ],
  },
};
