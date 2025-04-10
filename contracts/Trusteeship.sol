// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract Trusteeship is ReentrancyGuard {
    address payable public immutable feeAccount;
    uint public immutable feePercent;
    uint public itemCount;
    address public immutable allowedNFT;

    struct Item {
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable seller;
        bool sold;
    }

    mapping(uint => Item) public items;

    event Offered(uint itemId, address indexed nft, uint tokenId, uint price, address indexed seller, uint timestamp);
    event Bought(uint itemId, address indexed nft, uint tokenId, uint price, address indexed seller, address indexed buyer, uint totalPrice, uint timestamp);
    event Withdrawn(uint itemId, address indexed nft, uint tokenId, address indexed seller, uint timestamp);
    event PriceUpdated(uint itemId, uint oldPrice, uint newPrice, address indexed seller, uint timestamp);
    event Refunded(address indexed buyer, uint amount);

    constructor(uint _feePercent, address _allowedNFT) {
        require(_allowedNFT != address(0), "Invalid NFT contract address");
        feeAccount = payable(0x5Cfd8509D1c8dC26Bb567fF14D9ab1E01F5d5a32); // Hardcoded fee recipient
        feePercent = _feePercent;
        allowedNFT = _allowedNFT;
    }

    function listItem(IERC721 _nft, uint _tokenId, uint _price) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        require(address(_nft) == allowedNFT, "Only AureRealEstate NFTs allowed");
        
        itemCount++;
        
        _nft.transferFrom(msg.sender, address(this), _tokenId);
        
        items[itemCount] = Item(itemCount, _nft, _tokenId, _price, payable(msg.sender), false);
        
        emit Offered(itemCount, address(_nft), _tokenId, _price, msg.sender, block.timestamp);
    }

    function purchaseItem(uint _itemId) external payable nonReentrant {
        Item storage item = items[_itemId];
        require(_itemId > 0 && _itemId <= itemCount, "Item does not exist");
        require(!item.sold, "Item already sold");
        
        uint _totalPrice = getTotalPrice(_itemId);
        require(msg.value >= _totalPrice, "Insufficient Ether sent for price and fee");
        
        item.seller.transfer(item.price);
        feeAccount.transfer(_totalPrice - item.price);
        
        if (msg.value > _totalPrice) {
            uint refundAmount = msg.value - _totalPrice;
            console.log("Contract Balance Before Refund:", address(this).balance);
            console.log("Refund Amount:", refundAmount);
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Refund failed");
            console.log("Buyer Balance After Refund:", msg.sender.balance);
            emit Refunded(msg.sender, refundAmount);
        }
        
        item.sold = true;
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);
        
        emit Bought(_itemId, address(item.nft), item.tokenId, item.price, item.seller, msg.sender, _totalPrice, block.timestamp);
        
        delete items[_itemId];
    }

    function withdrawItem(uint _itemId) external nonReentrant {
        Item storage item = items[_itemId];
        require(_itemId > 0 && _itemId <= itemCount, "Item does not exist");
        require(msg.sender == item.seller, "Only seller can withdraw");
        require(!item.sold, "Item already sold");
        
        IERC721 nft = item.nft;
        uint tokenId = item.tokenId;
        
        nft.transferFrom(address(this), msg.sender, tokenId);
        require(nft.ownerOf(tokenId) == msg.sender, "Transfer failed");
        
        delete items[_itemId];
        
        emit Withdrawn(_itemId, address(nft), tokenId, msg.sender, block.timestamp);
    }

    function updateItemPrice(uint _itemId, uint _newPrice) external nonReentrant {
        Item storage item = items[_itemId];
        require(_itemId > 0 && _itemId <= itemCount, "Item does not exist");
        require(msg.sender == item.seller, "Only seller can update price");
        require(!item.sold, "Item already sold");
        require(_newPrice > 0, "New price must be greater than zero");

        uint oldPrice = item.price;
        item.price = _newPrice;
        
        emit PriceUpdated(_itemId, oldPrice, _newPrice, msg.sender, block.timestamp);
    }

    function getTotalPrice(uint _itemId) public view returns (uint) {
        Item memory item = items[_itemId];
        require(item.price > 0, "Item has no valid price or does not exist");
        uint basePrice = item.price;
        uint fee = (basePrice * feePercent) / 100;
        unchecked {
            return basePrice + fee;
        }
    }
}
