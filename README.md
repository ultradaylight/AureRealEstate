# AureRealEstate - Exclusive Real Estate NFTs on PulseChain

Welcome to **AureRealEstate**, a decentralized application (DApp) built on the PulseChain blockchain using Hardhat as the development environment. This project tokenizes real estate properties as NFTs (Non-Fungible Tokens), offering a collection of 100 exclusive properties. These properties are represented by unique ERC721 tokens and can be minted, bought, and sold via a marketplace smart contract. Given their limited supply, these NFTs have the potential to become highly valuable assets in the future.

## Mint Buy Sell Here: https://aurelips.com/aurerealestate/
Backup IPFS: https://ipfs.io/ipfs/bafybeigioy2vvufb2oxinkoqjmdzumwvga74km6fdlwxl72behah4ijkpa/

## Project Overview

AureRealEstate consists of two main smart contracts and a React-based frontend, all managed with Hardhat:
1. **AureRealEstate.sol**: An ERC721 NFT contract that allows minting of 100 unique property tokens on PulseChain. Each token represents a virtual real estate asset with metadata stored off-chain.
2. **Trusteeship.sol**: A marketplace contract that enables users to list, buy, update prices, or withdraw their NFTs, with a fee structure for transactions.
3. **Frontend**: A React application that provides a user interface to interact with the smart contracts, including minting, listing, and purchasing NFTs.

### Features
- **Minting**: Users can mint properties either sequentially or by specifying a token ID (1-100).
- **Marketplace**: List NFTs for sale, purchase listed NFTs, update listing prices, or withdraw unsold NFTs.
- **Exclusivity**: Only 100 properties exist, making this a rare and potentially valuable collection.
- **PulseChain**: Built on the energy-efficient PulseChain blockchain for fast and low-cost transactions.

## Prerequisites

To run this Hardhat project locally, you'll need the following tools installed:
- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Hardhat](https://hardhat.org/) (Ethereum development environment)
- A PulseChain wallet (e.g., [MetaMask](https://metamask.io/)) configured for the PulseChain network
- PulseChain PLS tokens for gas fees and minting
- A code editor (e.g., [VS Code](https://code.visualstudio.com/))

## Installation

Follow these steps to set up and run the Hardhat project on your computer:

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/aurerealestate.git
cd aurerealestate
```

### 2. Install Dependencies
Install Hardhat, frontend, and smart contract dependencies:
```bash
npm install
```

### 3. Configure Hardhat Environment
Create a `.env` file in the root directory and add the following:
```
PRIVATE_KEY=your_metamask_private_key
PULSECHAIN_RPC_URL=https://rpc.pulsechain.com
REACT_APP_AURE_ADDRESS=0xbb8F8DbF65e35Cd7A4d8615B3Fdd517E23757557
REACT_APP_TRUSTEESHIP_ADDRESS=0x3D0A54B6CcB5A36ec9E8006e5374255E474ecd88
```
- Replace `your_metamask_private_key` with your wallet's private key (keep it secure!).
- The `PULSECHAIN_RPC_URL` connects to the PulseChain network.
- The `REACT_APP_` variables link the frontend to the deployed contracts.

Update `hardhat.config.js` to include PulseChain (example below):
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.0",
  networks: {
    pulsechain: {
      url: process.env.PULSECHAIN_RPC_URL || "https://rpc.pulsechain.com",
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

### 4. Compile Smart Contracts
Compile the Solidity contracts using Hardhat:
```bash
npx hardhat compile
```
This generates artifacts in the `artifacts/` directory, which the frontend can use.

### 5. Test Smart Contracts (Optional)
Run Hardhat tests to verify contract functionality (if tests exist in `test/`):
```bash
npx hardhat test
```

### 6. Deploy Smart Contracts (Optional)
If you want to deploy your own instance (instead of using the existing contracts), run:
```bash
npx hardhat run scripts/deploy.js --network pulsechain
```
- See the "Deployed Contracts" section below for the live contract addresses on PulseChain.

#### Example `scripts/deploy.js`:
```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const AureRealEstate = await hre.ethers.getContractFactory("AUREREALESTATE");
  const aureRealEstate = await AureRealEstate.deploy(
    "AureRealEstate", // Name
    "AURE",          // Symbol
    1000000n * 10n**18n, // Cost: 1M PLS in wei
    "https://your-base-uri.com/" // Base URI for metadata
  );
  await aureRealEstate.deployed();
  console.log("AureRealEstate deployed to:", aureRealEstate.address);

  const Trusteeship = await hre.ethers.getContractFactory("Trusteeship");
  const trusteeship = await Trusteeship.deploy(
    2, // 2% fee
    aureRealEstate.address // Allowed NFT contract
  );
  await trusteeship.deployed();
  console.log("Trusteeship deployed to:", trusteeship.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 7. Run the Frontend
Start the React frontend:
```bash
npm start
```
The app will open in your browser at `http://localhost:3000`. Ensure your wallet is connected to PulseChain and has PLS for transactions.

## Deployed Contracts

The following contracts are already deployed on PulseChain (Network ID: 369). You can interact with them directly using their addresses:

- **PulseChain (369)**:
  - **AureRealEstate**: `0xbb8F8DbF65e35Cd7A4d8615B3Fdd517E23757557`
  - **Trusteeship**: `0x3D0A54B6CcB5A36ec9E8006e5374255E474ecd88`

To use these in your frontend, ensure the addresses match the `REACT_APP_` variables in your `.env` file.

## How It Works

### Smart Contracts
- **AureRealEstate.sol**:
  - Mint properties with `mint()` (sequential) or `mintSpecific()` (specific token ID).
  - Each token has a cost (e.g., 1M PLS) and a unique URI pointing to metadata (e.g., JSON files with property details).
  - Only the owner can withdraw funds or update the base URI.
- **Trusteeship.sol**:
  - List an NFT for sale with `listItem()`.
  - Buy a listed NFT with `purchaseItem()`, including a fee (e.g., 2%) sent to a hardcoded fee account.
  - Sellers can update prices with `updateItemPrice()` or withdraw unsold NFTs with `withdrawItem()`.

### Frontend
The React frontend (located in the `src/` directory) provides a user-friendly interface:
- **Wallet Connection**: Connects to MetaMask or another PulseChain-compatible wallet.
- **Minting**: Allows users to mint new properties by calling the `AureRealEstate` contract.
- **Marketplace**: Displays listed NFTs, enabling users to buy, list, or manage their properties via the `Trusteeship` contract.
- **Components**: Organized in `src/components/` (assumed structure) for modularity.

To explore the frontend code, check the `src/` directory. Key files include:
- `src/App.js`: Main application entry point.
- `src/components/`: Reusable UI components (e.g., minting form, marketplace listings).

## What Users Can Do
- **Mint Properties**: Create your own exclusive real estate NFT (up to 100 total) using the deployed `AureRealEstate` contract.
- **Trade NFTs**: List your properties for sale or buy others on the marketplace via the `Trusteeship` contract.
- **Speculate**: Hold onto these rare NFTs as they may increase in value over time.
- **Customize**: Modify the frontend in `src/` or extend the Hardhat scripts/tests in `scripts/` and `test/`.

## Project Structure
- `contracts/AureRealEstate.sol`: NFT minting contract.
- `contracts/Trusteeship.sol`: Marketplace contract.
- `src/`: React frontend code (e.g., `App.js`, `components/`).
- `scripts/deploy.js`: Hardhat deployment script (create this based on the example above).
- `test/`: Hardhat test files (optional; add your own).
- `hardhat.config.js`: Hardhat configuration file.
- `package.json`: Project dependencies and scripts.
- `artifacts/`: Compiled contract artifacts (generated by Hardhat).

## Acknowledgments
- **[Dapp University GitHub](https://github.com/dappuniversity)**: Inspiration and educational resources for building DApps.
- **Grok**: Provided property photos for the NFT metadata.
- **Henry Chen**: Created the DApp front-page photo.

## License
This project is licensed under the MIT License - see the SPDX headers in the Solidity files.
