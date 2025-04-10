const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "PLS");

  const AureRealEstate = await hre.ethers.getContractFactory("AUREREALESTATE");
  const cost = hre.ethers.utils.parseEther("1000000"); // 1,000,000 PLS
  const initialBaseURI = "ipfs://bafybeidqoczbblpe7aiynqhnxkcwj73zszspuieqdl6uehurhrwjfnncma/";
  const aureRealEstate = await AureRealEstate.deploy(
    "AureRealEstate",
    "ARE",
    cost,
    initialBaseURI
  );

  await aureRealEstate.deployed();
  console.log("AureRealEstate deployed to:", aureRealEstate.address);

  const feePercent = 2; // 2% fee
  const Trusteeship = await hre.ethers.getContractFactory("Trusteeship");
  const trusteeship = await Trusteeship.deploy(feePercent, aureRealEstate.address);

  await trusteeship.deployed();
  console.log("Trusteeship deployed to:", trusteeship.address);

  console.log("Waiting for block confirmations...");
  await aureRealEstate.deployTransaction.wait(5);
  await trusteeship.deployTransaction.wait(5);

  console.log("Deployment complete!");
  console.log("Contracts deployed to:");
  console.log("- AureRealEstate:", aureRealEstate.address);
  console.log("- Trusteeship:", trusteeship.address);
  console.log(
    "For Sourcify verification, submit the contract source and metadata to: https://sourcify.pulsechain.com/"
  );
  console.log("AureRealEstate constructor args:", [
    "AureRealEstate",
    "ARE",
    cost.toString(),
    initialBaseURI,
  ]);
  console.log("Trusteeship constructor args:", [feePercent, aureRealEstate.address]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
