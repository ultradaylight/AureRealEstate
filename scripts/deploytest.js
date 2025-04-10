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

  console.log("Verifying AureRealEstate...");
  await hre.run("verify:verify", {
    address: aureRealEstate.address,
    constructorArguments: ["AureRealEstate", "AURE", cost, initialBaseURI],
    network: "pulseTestnetV4",
  });

  console.log("Verifying Trusteeship...");
  await hre.run("verify:verify", {
    address: trusteeship.address,
    constructorArguments: [feePercent, aureRealEstate.address],
    network: "pulseTestnetV4",
  });

  console.log("Deployment and verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
