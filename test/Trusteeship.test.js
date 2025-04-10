const { expect } = require("chai");
const { ethers } = require("hardhat");

const chai = require("chai");
const BN = require("bn.js");
chai.use(require("chai-bn")(BN));

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Trusteeship", function () {
  let aureRealEstate, trusteeship, deployer, seller, buyer;
  const COST = tokens(0.01);
  const FEE_PERCENT = 2;
  const BASE_URI = "ipfs://bafybeidqoczbblpe7aiynqhnxkcwj73zszspuieqdl6uehurhrwjfnncma/";
  const SAMPLE_TOKEN_ID = "1";
  const LISTING_PRICE = tokens(1);
  const MAX_UINT256 = ethers.BigNumber.from("2").pow(256).sub(1);

  beforeEach(async function () {
    [deployer, seller, buyer] = await ethers.getSigners();

    const AUREREALESTATE = await ethers.getContractFactory("AUREREALESTATE");
    aureRealEstate = await AUREREALESTATE.deploy("Aure Real Estate", "AURE", COST, BASE_URI);
    await aureRealEstate.deployed();

    const Trusteeship = await ethers.getContractFactory("Trusteeship");
    trusteeship = await Trusteeship.deploy(FEE_PERCENT, aureRealEstate.address);
    await trusteeship.deployed();

    await aureRealEstate.connect(seller).mint(SAMPLE_TOKEN_ID, { value: COST });
  });

  describe("Deployment", function () {
    it("Should set the correct fee account", async function () {
      expect(await trusteeship.feeAccount()).to.equal("0x5Cfd8509D1c8dC26Bb567fF14D9ab1E01F5d5a32");
    });

    it("Should set the correct fee percent", async function () {
      expect(await trusteeship.feePercent()).to.equal(FEE_PERCENT);
    });

    it("Should set the correct allowed NFT contract", async function () {
      expect(await trusteeship.allowedNFT()).to.equal(aureRealEstate.address);
    });

    it("Should initialize itemCount to 0", async function () {
      expect(await trusteeship.itemCount()).to.equal(0);
    });
  });

  describe("listItem", function () {
    it("Should list an NFT successfully", async function () {
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      const tx = await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(trusteeship, "Offered")
        .withArgs(1, aureRealEstate.address, 1, LISTING_PRICE, seller.address, block.timestamp);

      const item = await trusteeship.items(1);
      expect(item.itemId).to.equal(1);
      expect(item.nft).to.equal(aureRealEstate.address);
      expect(item.tokenId).to.equal(1);
      expect(item.price).to.equal(LISTING_PRICE);
      expect(item.seller).to.equal(seller.address);
      expect(item.sold).to.equal(false);
      expect(await aureRealEstate.ownerOf(1)).to.equal(trusteeship.address);
      expect(await trusteeship.itemCount()).to.equal(1);
    });

    it("Should fail if price is zero", async function () {
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      await expect(
        trusteeship.connect(seller).listItem(aureRealEstate.address, 1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("Should fail if NFT is not allowed", async function () {
      const OtherNFT = await ethers.getContractFactory("AUREREALESTATE");
      const otherNFT = await OtherNFT.deploy("Other NFT", "ONFT", COST, BASE_URI);
      await otherNFT.connect(seller).mint(SAMPLE_TOKEN_ID, { value: COST });
      await otherNFT.connect(seller).approve(trusteeship.address, 1);
      await expect(
        trusteeship.connect(seller).listItem(otherNFT.address, 1, LISTING_PRICE)
      ).to.be.revertedWith("Only AureRealEstate NFTs allowed");
    });

    it("Should fail if not approved", async function () {
      await expect(
        trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE)
      ).to.be.revertedWith("ERC721: caller is not token owner nor approved");
    });

    it("Should allow seller to list multiple NFTs", async function () {
      await aureRealEstate.connect(seller).mint("2", { value: COST });
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      await aureRealEstate.connect(seller).approve(trusteeship.address, 2);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 2, LISTING_PRICE);
      expect(await trusteeship.itemCount()).to.equal(2);
    });

    it("Should fail if listing an already listed NFT", async function () {
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE);
      await expect(
        trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE)
      ).to.be.revertedWith("ERC721: transfer from incorrect owner");
    });

    it("Should list with setApprovalForAll", async function () {
      await aureRealEstate.connect(seller).setApprovalForAll(trusteeship.address, true);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE);
      expect(await aureRealEstate.ownerOf(1)).to.equal(trusteeship.address);
      expect(await trusteeship.itemCount()).to.equal(1);
    });

    it("Should allow re-listing after withdrawal", async function () {
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE);
      await trusteeship.connect(seller).withdrawItem(1);
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE);
      expect(await trusteeship.itemCount()).to.equal(2);
      expect(await aureRealEstate.ownerOf(1)).to.equal(trusteeship.address);
    });

    it("Should list with a very high price", async function () {
      const highPrice = MAX_UINT256.div(100);
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, highPrice);
      const item = await trusteeship.items(1);
      expect(item.price).to.equal(highPrice);
      expect(await aureRealEstate.ownerOf(1)).to.equal(trusteeship.address);
    });
  });

  describe("purchaseItem", function () {
    beforeEach(async function () {
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE);
    });

    it("Should purchase an item successfully", async function () {
      const totalPrice = await trusteeship.getTotalPrice(1);
      const sellerInitialBalance = await ethers.provider.getBalance(seller.address);

      const tx = await trusteeship.connect(buyer).purchaseItem(1, { value: totalPrice });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(trusteeship, "Bought")
        .withArgs(1, aureRealEstate.address, 1, LISTING_PRICE, seller.address, buyer.address, totalPrice, block.timestamp);

      expect(await aureRealEstate.ownerOf(1)).to.equal(buyer.address);
      const item = await trusteeship.items(1);
      expect(item.price).to.equal(0);
      expect(await ethers.provider.getBalance(seller.address)).to.be.above(sellerInitialBalance);
    });

    it("Should refund excess payment", async function () {
      const totalPrice = await trusteeship.getTotalPrice(1);
      const overPayment = totalPrice.add(tokens(0.5));
      const buyerInitialBalance = await ethers.provider.getBalance(buyer.address);
      console.log("Initial Balance (Test):", buyerInitialBalance.toString());

      const tx = await trusteeship.connect(buyer).purchaseItem(1, { value: overPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(tx.gasPrice);
      const buyerFinalBalance = await ethers.provider.getBalance(buyer.address);

      console.log("Total Price:", totalPrice.toString());
      console.log("Overpayment:", overPayment.toString());
      console.log("Gas Used:", gasUsed.toString());
      console.log("Final Balance (Test):", buyerFinalBalance.toString());

      await expect(tx)
        .to.emit(trusteeship, "Refunded")
        .withArgs(buyer.address, tokens(0.5));

      const expectedBalance = buyerInitialBalance
        .sub(totalPrice)
        .sub(gasUsed)
        .add(tokens(0.5));
      console.log("Expected Balance:", expectedBalance.toString());
    });

    it("Should purchase with exact payment (no refund)", async function () {
      const totalPrice = await trusteeship.getTotalPrice(1);
      const tx = await trusteeship.connect(buyer).purchaseItem(1, { value: totalPrice });
      await expect(tx).to.emit(trusteeship, "Bought");
      await expect(tx).to.not.emit(trusteeship, "Refunded");
      expect(await aureRealEstate.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should purchase after price update", async function () {
      const newPrice = tokens(2);
      await trusteeship.connect(seller).updateItemPrice(1, newPrice);
      const totalPrice = await trusteeship.getTotalPrice(1);
      const expectedFee = newPrice.mul(FEE_PERCENT).div(100);
      const expectedTotal = newPrice.add(expectedFee);

      const tx = await trusteeship.connect(buyer).purchaseItem(1, { value: totalPrice });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(trusteeship, "Bought")
        .withArgs(1, aureRealEstate.address, 1, newPrice, seller.address, buyer.address, expectedTotal, block.timestamp);
      expect(await aureRealEstate.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should fail if item doesn’t exist", async function () {
      await expect(
        trusteeship.connect(buyer).purchaseItem(999, { value: LISTING_PRICE })
      ).to.be.revertedWith("Item does not exist");
    });

    it("Should fail if already sold", async function () {
      const totalPrice = await trusteeship.getTotalPrice(1);
      await trusteeship.connect(buyer).purchaseItem(1, { value: totalPrice });
      await expect(
        trusteeship.connect(buyer).purchaseItem(1, { value: totalPrice })
      ).to.be.revertedWith("Item has no valid price or does not exist");
    });

    it("Should fail if insufficient funds", async function () {
      await expect(
        trusteeship.connect(buyer).purchaseItem(1, { value: tokens(0.5) })
      ).to.be.revertedWith("Insufficient Ether sent for price and fee");
    });
  });

  describe("withdrawItem", function () {
    beforeEach(async function () {
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE);
    });

    it("Should withdraw an item successfully", async function () {
      const ownerBefore = await aureRealEstate.ownerOf(1);
      console.log("Owner Before Withdraw (should be contract):", ownerBefore);
      console.log("Contract Address:", trusteeship.address);
      console.log("Seller Address:", seller.address);

      const tx = await trusteeship.connect(seller).withdrawItem(1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(trusteeship, "Withdrawn")
        .withArgs(1, aureRealEstate.address, 1, seller.address, block.timestamp);

      const ownerAfter = await aureRealEstate.ownerOf(1);
      console.log("Owner After Withdraw (should be seller):", ownerAfter);
      expect(ownerAfter).to.equal(seller.address);
      const item = await trusteeship.items(1);
      expect(item.price).to.equal(0);
    });

    it("Should withdraw after failed purchase attempt", async function () {
      await expect(
        trusteeship.connect(buyer).purchaseItem(1, { value: tokens(0.5) })
      ).to.be.revertedWith("Insufficient Ether sent for price and fee");
      await trusteeship.connect(seller).withdrawItem(1);
      expect(await aureRealEstate.ownerOf(1)).to.equal(seller.address);
      const item = await trusteeship.items(1);
      expect(item.price).to.equal(0);
    });

    it("Should fail if not seller", async function () {
      await expect(
        trusteeship.connect(buyer).withdrawItem(1)
      ).to.be.revertedWith("Only seller can withdraw");
    });

    it("Should fail if item doesn’t exist", async function () {
      await expect(
        trusteeship.connect(seller).withdrawItem(999)
      ).to.be.revertedWith("Item does not exist");
    });

    it("Should fail if already sold", async function () {
      const totalPrice = await trusteeship.getTotalPrice(1);
      await trusteeship.connect(buyer).purchaseItem(1, { value: totalPrice });
      await expect(
        trusteeship.connect(seller).withdrawItem(1)
      ).to.be.revertedWith("Only seller can withdraw");
    });
  });

  describe("updateItemPrice", function () {
    beforeEach(async function () {
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE);
    });

    it("Should update item price successfully", async function () {
      const newPrice = tokens(2);
      const tx = await trusteeship.connect(seller).updateItemPrice(1, newPrice);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(trusteeship, "PriceUpdated")
        .withArgs(1, LISTING_PRICE, newPrice, seller.address, block.timestamp);

      const item = await trusteeship.items(1);
      expect(item.price).to.equal(newPrice);
    });

    it("Should allow multiple price updates", async function () {
      const price1 = tokens(2);
      const price2 = tokens(3);
      await trusteeship.connect(seller).updateItemPrice(1, price1);
      const tx = await trusteeship.connect(seller).updateItemPrice(1, price2);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(trusteeship, "PriceUpdated")
        .withArgs(1, price1, price2, seller.address, block.timestamp);

      const item = await trusteeship.items(1);
      expect(item.price).to.equal(price2);
    });

    it("Should update to a very high price", async function () {
      const highPrice = MAX_UINT256.div(100);
      const tx = await trusteeship.connect(seller).updateItemPrice(1, highPrice);
      const item = await trusteeship.items(1);
      expect(item.price).to.equal(highPrice);
    });

    it("Should fail if not seller", async function () {
      await expect(
        trusteeship.connect(buyer).updateItemPrice(1, tokens(2))
      ).to.be.revertedWith("Only seller can update price");
    });

    it("Should fail if item doesn’t exist", async function () {
      await expect(
        trusteeship.connect(seller).updateItemPrice(999, tokens(2))
      ).to.be.revertedWith("Item does not exist");
    });

    it("Should fail if already sold", async function () {
      const totalPrice = await trusteeship.getTotalPrice(1);
      await trusteeship.connect(buyer).purchaseItem(1, { value: totalPrice });
      await expect(
        trusteeship.connect(seller).updateItemPrice(1, tokens(2))
      ).to.be.revertedWith("Only seller can update price");
    });

    it("Should fail if new price is zero", async function () {
      await expect(
        trusteeship.connect(seller).updateItemPrice(1, 0)
      ).to.be.revertedWith("New price must be greater than zero");
    });
  });

  describe("getTotalPrice", function () {
    beforeEach(async function () {
      await aureRealEstate.connect(seller).approve(trusteeship.address, 1);
      await trusteeship.connect(seller).listItem(aureRealEstate.address, 1, LISTING_PRICE);
    });

    it("Should return correct total price", async function () {
      const expectedFee = LISTING_PRICE.mul(FEE_PERCENT).div(100);
      const expectedTotal = LISTING_PRICE.add(expectedFee);
      expect(await trusteeship.getTotalPrice(1)).to.equal(expectedTotal);
    });

    it("Should fail if item doesn’t exist", async function () {
      await expect(trusteeship.getTotalPrice(999)).to.be.revertedWith("Item has no valid price or does not exist");
    });
  });
});
