const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("AUREREALESTATE", function () {
  let aureRealEstate, deployer, minter;
  const COST = tokens(1); // Reduced to 1 ETH to avoid insufficient funds in tests
  const MAX_SUPPLY = 100;
  const BASE_URI = "ipfs://bafybeidqoczbblpe7aiynqhnxkcwj73zszspuieqdl6uehurhrwjfnncma/";
  const SAMPLE_TOKEN_ID = "1";

  beforeEach(async function () {
    [deployer, minter] = await ethers.getSigners();

    const AUREREALESTATE = await ethers.getContractFactory("AUREREALESTATE");
    aureRealEstate = await AUREREALESTATE.deploy("Aure Real Estate", "AURE", COST, BASE_URI);
    await aureRealEstate.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await aureRealEstate.owner()).to.equal(deployer.address);
    });

    it("Should set the correct cost", async function () {
      expect(await aureRealEstate.cost()).to.equal(COST);
    });

    it("Should set the correct max supply", async function () {
      expect(await aureRealEstate.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it("Should set the correct base URI", async function () {
      await aureRealEstate.connect(minter).mintSpecific(SAMPLE_TOKEN_ID, `${BASE_URI}${SAMPLE_TOKEN_ID}.json`, { value: COST });
      const tokenUri = await aureRealEstate.tokenURI(1);
      expect(tokenUri).to.equal(`${BASE_URI}1.json`);
    });
  });

  describe("Minting with mint()", function () {
    it("Should mint an NFT and assign it to the minter", async function () {
      await aureRealEstate.connect(minter).mint(`${BASE_URI}1.json`, { value: COST });
      expect(await aureRealEstate.ownerOf(1)).to.equal(minter.address);
      expect(await aureRealEstate.tokenURI(1)).to.equal(`${BASE_URI}1.json`);
      expect(await aureRealEstate.totalSupply()).to.equal(1);
    });

    it("Should fail if insufficient funds are sent", async function () {
      await expect(
        aureRealEstate.connect(minter).mint(`${BASE_URI}1.json`, { value: tokens(0.005) })
      ).to.be.revertedWith("Insufficient funds to mint");
    });

    it("Should fail if max supply is reached", async function () {
      for (let i = 0; i < MAX_SUPPLY; i++) {
        await aureRealEstate.connect(minter).mint(`${BASE_URI}${i + 1}.json`, { value: COST });
      }
      await expect(
        aureRealEstate.connect(minter).mint(`${BASE_URI}${SAMPLE_TOKEN_ID}.json`, { value: COST })
      ).to.be.revertedWith("Max supply reached");
    });

    it("Should emit MaxSupplyReached when limit is hit", async function () {
      for (let i = 0; i < MAX_SUPPLY - 1; i++) {
        await aureRealEstate.connect(minter).mint(`${BASE_URI}${i + 1}.json`, { value: COST });
      }
      await expect(aureRealEstate.connect(minter).mint(`${BASE_URI}${MAX_SUPPLY}.json`, { value: COST }))
        .to.emit(aureRealEstate, "MaxSupplyReached")
        .withArgs(MAX_SUPPLY);
    });
  });

  describe("Minting with mintSpecific()", function () {
    it("Should mint a specific token ID and assign it to the minter", async function () {
      const tokenId = "5";
      await aureRealEstate.connect(minter).mintSpecific(tokenId, `${BASE_URI}${tokenId}.json`, { value: COST });
      expect(await aureRealEstate.ownerOf(tokenId)).to.equal(minter.address);
      expect(await aureRealEstate.tokenURI(tokenId)).to.equal(`${BASE_URI}${tokenId}.json`);
      expect(await aureRealEstate.totalSupply()).to.equal(1);
    });

    it("Should fail if token ID is already minted", async function () {
      const tokenId = "5";
      await aureRealEstate.connect(minter).mintSpecific(tokenId, `${BASE_URI}${tokenId}.json`, { value: COST });
      await expect(
        aureRealEstate.connect(minter).mintSpecific(tokenId, `${BASE_URI}${tokenId}.json`, { value: COST })
      ).to.be.revertedWith("Token already minted");
    });

    it("Should fail if insufficient funds are sent", async function () {
      const tokenId = "5";
      await expect(
        aureRealEstate.connect(minter).mintSpecific(tokenId, `${BASE_URI}${tokenId}.json`, { value: tokens(0.005) })
      ).to.be.revertedWith("Insufficient funds to mint");
    });

    it("Should fail if token ID is out of range", async function () {
      const tokenIdTooHigh = "101";
      await expect(
        aureRealEstate.connect(minter).mintSpecific(tokenIdTooHigh, `${BASE_URI}${tokenIdTooHigh}.json`, { value: COST })
      ).to.be.revertedWith("Token ID out of range");

      const tokenIdZero = "0";
      await expect(
        aureRealEstate.connect(minter).mintSpecific(tokenIdZero, `${BASE_URI}${tokenIdZero}.json`, { value: COST })
      ).to.be.revertedWith("Token ID out of range");
    });

    it("Should fail if max supply is reached", async function () {
      for (let i = 1; i <= MAX_SUPPLY; i++) {
        await aureRealEstate.connect(minter).mintSpecific(i.toString(), `${BASE_URI}${i}.json`, { value: COST });
      }
      expect(await aureRealEstate.totalSupply()).to.equal(MAX_SUPPLY);

      // Fixed: Expect "Max supply reached" since maxSupply check comes first
      await expect(
        aureRealEstate.connect(minter).mintSpecific("1", `${BASE_URI}1.json`, { value: COST })
      ).to.be.revertedWith("Max supply reached");
    });

    it("Should emit MaxSupplyReached when totalSupply hits max", async function () {
      for (let i = 1; i < MAX_SUPPLY; i++) {
        await aureRealEstate.connect(minter).mintSpecific(i.toString(), `${BASE_URI}${i}.json`, { value: COST });
      }
      await expect(
        aureRealEstate.connect(minter).mintSpecific(MAX_SUPPLY.toString(), `${BASE_URI}${MAX_SUPPLY}.json`, { value: COST })
      ).to.emit(aureRealEstate, "MaxSupplyReached").withArgs(MAX_SUPPLY);
    });

    it("Should allow minting non-sequential IDs", async function () {
      await aureRealEstate.connect(minter).mintSpecific("10", `${BASE_URI}10.json`, { value: COST });
      await aureRealEstate.connect(minter).mintSpecific("5", `${BASE_URI}5.json`, { value: COST });
      await aureRealEstate.connect(minter).mintSpecific("50", `${BASE_URI}50.json`, { value: COST });

      expect(await aureRealEstate.ownerOf("10")).to.equal(minter.address);
      expect(await aureRealEstate.ownerOf("5")).to.equal(minter.address);
      expect(await aureRealEstate.ownerOf("50")).to.equal(minter.address);
      expect(await aureRealEstate.totalSupply()).to.equal(3);
    });

    it("Should successfully mint all 100 NFTs with specific IDs", async function () {
      for (let i = 1; i <= MAX_SUPPLY; i++) {
        const tokenId = i.toString();
        await aureRealEstate.connect(minter).mintSpecific(tokenId, `${BASE_URI}${tokenId}.json`, { value: COST });
      }
      expect(await aureRealEstate.totalSupply()).to.equal(MAX_SUPPLY);
      expect(await aureRealEstate.tokenURI("100")).to.equal(`${BASE_URI}100.json`);
      expect(await aureRealEstate.balanceOf(minter.address)).to.equal(MAX_SUPPLY);
    });
  });

  describe("Token URI", function () {
    it("Should return correct URI after minting with mintSpecific", async function () {
      await aureRealEstate.connect(minter).mintSpecific(SAMPLE_TOKEN_ID, `${BASE_URI}${SAMPLE_TOKEN_ID}.json`, { value: COST });
      expect(await aureRealEstate.tokenURI(1)).to.equal(`${BASE_URI}1.json`);
    });

    it("Should revert if token doesn’t exist", async function () {
      await expect(aureRealEstate.tokenURI(1)).to.be.revertedWith("ERC721: invalid token ID");
    });
  });

  describe("Set Base URI", function () {
    it("Should allow owner to update base URI", async function () {
      const newBaseURI = "ipfs://newhash/";
      await aureRealEstate.connect(deployer).setBaseURI(newBaseURI);
      await aureRealEstate.connect(minter).mintSpecific(SAMPLE_TOKEN_ID, `${newBaseURI}${SAMPLE_TOKEN_ID}.json`, { value: COST });
      expect(await aureRealEstate.tokenURI(1)).to.equal(`${newBaseURI}1.json`);
    });

    it("Should fail if non-owner tries to update base URI", async function () {
      await expect(
        aureRealEstate.connect(minter).setBaseURI("ipfs://newhash/")
      ).to.be.revertedWith("Only the owner can perform this action");
    });
  });

  describe("Withdrawal", function () {
    it("Should allow owner to withdraw funds", async function () {
      await aureRealEstate.connect(minter).mintSpecific(SAMPLE_TOKEN_ID, `${BASE_URI}${SAMPLE_TOKEN_ID}.json`, { value: COST });
      const initialBalance = await ethers.provider.getBalance(deployer.address);
      const tx = await aureRealEstate.connect(deployer).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(tx.gasPrice);
      const finalBalance = await ethers.provider.getBalance(deployer.address);
      expect(finalBalance).to.be.above(initialBalance.sub(gasUsed));
    });

    it("Should fail if non-owner tries to withdraw", async function () {
      await aureRealEstate.connect(minter).mintSpecific(SAMPLE_TOKEN_ID, `${BASE_URI}${SAMPLE_TOKEN_ID}.json`, { value: COST });
      await expect(
        aureRealEstate.connect(minter).withdraw()
      ).to.be.revertedWith("Only the owner can perform this action");
    });
  });

  describe("Transfer Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      await aureRealEstate.connect(deployer).transferOwnership(minter.address);
      expect(await aureRealEstate.owner()).to.equal(minter.address);
    });

    it("Should fail if non-owner tries to transfer ownership", async function () {
      await expect(
        aureRealEstate.connect(minter).transferOwnership(minter.address)
      ).to.be.revertedWith("Only the owner can perform this action");
    });

    it("Should fail if transferring to zero address", async function () {
      await expect(
        aureRealEstate.connect(deployer).transferOwnership(ethers.constants.AddressZero)
      ).to.be.revertedWith("New owner is the zero address");
    });
  });

  describe("Mint All 100 NFTs", function () {
    it("Should successfully mint all 100 NFTs with original mint()", async function () {
      for (let i = 0; i < MAX_SUPPLY; i++) {
        const tokenId = `${i + 1}`;
        await aureRealEstate.connect(minter).mint(`${BASE_URI}${tokenId}.json`, { value: COST });
      }
      expect(await aureRealEstate.totalSupply()).to.equal(MAX_SUPPLY);
      expect(await aureRealEstate.tokenURI(100)).to.equal(`${BASE_URI}100.json`);
      expect(await aureRealEstate.balanceOf(minter.address)).to.equal(MAX_SUPPLY);
    });
  });

  describe("Max Supply and Token ID Exhaustion", function () {
    it("Should only reach max supply when all token IDs 1 to 100 are minted", async function () {
      // Mint all token IDs in random order using mintSpecific
      const tokenIds = Array.from({ length: MAX_SUPPLY }, (_, i) => i + 1);
      // Shuffle token IDs to simulate non-sequential minting
      for (let i = tokenIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tokenIds[i], tokenIds[j]] = [tokenIds[j], tokenIds[i]];
      }

      for (let i = 0; i < MAX_SUPPLY; i++) {
        const tokenId = tokenIds[i].toString();
        await aureRealEstate.connect(minter).mintSpecific(tokenId, `${BASE_URI}${tokenId}.json`, { value: COST });
        expect(await aureRealEstate.totalSupply()).to.equal(i + 1);
      }

      // Verify all token IDs from 1 to 100 are minted
      for (let i = 1; i <= MAX_SUPPLY; i++) {
        expect(await aureRealEstate.ownerOf(i)).to.equal(minter.address);
      }

      // Verify max supply is reached
      expect(await aureRealEstate.totalSupply()).to.equal(MAX_SUPPLY);

      // Fixed: Expect "Max supply reached" since maxSupply check comes first
      await expect(
        aureRealEstate.connect(minter).mintSpecific("1", `${BASE_URI}1.json`, { value: COST })
      ).to.be.revertedWith("Max supply reached");

      await expect(
        aureRealEstate.connect(minter).mint(`${BASE_URI}101.json`, { value: COST })
      ).to.be.revertedWith("Max supply reached");
    });

    it("Should correctly handle mixed mint and mintSpecific calls", async function () {
      // Mint first 50 tokens sequentially using mint()
      for (let i = 0; i < 50; i++) {
        await aureRealEstate.connect(minter).mint(`${BASE_URI}${i + 1}.json`, { value: COST });
      }
      expect(await aureRealEstate.totalSupply()).to.equal(50);

      // Mint remaining 50 tokens using mintSpecific() in reverse order
      for (let i = MAX_SUPPLY; i > 50; i--) {
        await aureRealEstate.connect(minter).mintSpecific(i.toString(), `${BASE_URI}${i}.json`, { value: COST });
      }
      expect(await aureRealEstate.totalSupply()).to.equal(MAX_SUPPLY);

      // Verify all token IDs from 1 to 100 are minted
      for (let i = 1; i <= MAX_SUPPLY; i++) {
        expect(await aureRealEstate.ownerOf(i)).to.equal(minter.address);
      }

      // Fixed: Expect "Max supply reached" since maxSupply check comes first
      await expect(
        aureRealEstate.connect(minter).mint(`${BASE_URI}101.json`, { value: COST })
      ).to.be.revertedWith("Max supply reached");

      await expect(
        aureRealEstate.connect(minter).mintSpecific("1", `${BASE_URI}1.json`, { value: COST })
      ).to.be.revertedWith("Max supply reached");
    });

    it("Should correctly track totalSupply and token ownership", async function () {
      // Mint tokens in a scattered pattern
      const tokenIdsToMint = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      for (const tokenId of tokenIdsToMint) {
        await aureRealEstate.connect(minter).mintSpecific(tokenId.toString(), `${BASE_URI}${tokenId}.json`, { value: COST });
      }
      expect(await aureRealEstate.totalSupply()).to.equal(tokenIdsToMint.length);

      // Mint remaining tokens sequentially
      let mintedCount = tokenIdsToMint.length;
      for (let i = 1; i <= MAX_SUPPLY && mintedCount < MAX_SUPPLY; i++) {
        if (!tokenIdsToMint.includes(i)) {
          await aureRealEstate.connect(minter).mintSpecific(i.toString(), `${BASE_URI}${i}.json`, { value: COST });
          mintedCount++;
        }
      }
      expect(await aureRealEstate.totalSupply()).to.equal(MAX_SUPPLY);

      // Verify all tokens are minted
      for (let i = 1; i <= MAX_SUPPLY; i++) {
        expect(await aureRealEstate.ownerOf(i)).to.equal(minter.address);
      }
    });
  });
});
