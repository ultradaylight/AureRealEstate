const hre = require("hardhat");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
  // Setup accounts
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);

  // Deploy AUREREALESTATE
  const AUREREALESTATE = await ethers.getContractFactory("AUREREALESTATE");
  const cost = tokens(0.01);
  const initialBaseURI = "ipfs://bafybeidqoczbblpe7aiynqhnxkcwj73zszspuieqdl6uehurhrwjfnncma/";
  const aureRealEstate = await AUREREALESTATE.deploy(
    "Aure Real Estate",
    "AURE",
    cost,
    initialBaseURI
  );
  await aureRealEstate.deployed();
  console.log(`Deployed AUREREALESTATE Contract at: ${aureRealEstate.address}`);

  // Debug contract state
  console.log("Cost:", ethers.utils.formatEther(await aureRealEstate.cost()));
  console.log("Max Supply:", (await aureRealEstate.maxSupply()).toString());
  try {
    console.log("BaseURI:", await aureRealEstate._baseURI());
  } catch (e) {
    console.error("Error calling _baseURI():", e.message);
  }

  // Deploy Trusteeship
  const Trusteeship = await ethers.getContractFactory("Trusteeship");
  const feePercent = 2;
  const trusteeship = await Trusteeship.deploy(feePercent, aureRealEstate.address);
  await trusteeship.deployed();
  console.log(`Deployed Trusteeship Contract at: ${trusteeship.address}`);

  // Mint 3 NFTs using mintSpecific
  console.log(`Minting 3 test NFTs with mintSpecific...\n`);
  for (let i = 1; i <= 3; i++) {
    const tokenURI = `${initialBaseURI}${i}.json`;
    const transaction = await aureRealEstate.connect(deployer).mintSpecific(i, tokenURI, {
      value: cost,
    });
    await transaction.wait();
    console.log(`Minted NFT #${i} with URI: ${tokenURI}`);
  }

  // Approve and list NFT #1
  console.log(`Listing NFT #1 on Trusteeship...\n`);
  await aureRealEstate.connect(deployer).approve(trusteeship.address, 1);
  await trusteeship.connect(deployer).listItem(aureRealEstate.address, 1, tokens(1));
  console.log(`Listed NFT #1 on Trusteeship for 1 ETH`);

  console.log(`Finished deployment and test setup.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
