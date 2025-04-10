// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; 

contract AUREREALESTATE is ERC721URIStorage, ERC721Enumerable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; // Still tracks total minted for totalSupply

    address public owner;
    uint256 public cost;
    uint256 public maxSupply = 100;

    string private _baseURIString; // Renamed from baseURI to avoid conflict

    event MaxSupplyReached(uint256 totalSupply);
    event BaseURIUpdated(string newBaseURI);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _cost,
        string memory _initialBaseURI
    ) ERC721(_name, _symbol) {
        owner = msg.sender;
        cost = _cost; // e.g., 1_000_000 * 10**18 for 1 Million PLS
        _baseURIString = _initialBaseURI; // Updated variable name
    }

    // Original mint function (sequential)
    function mint(string memory _tokenURI) public payable {
        require(msg.value >= cost, "Insufficient funds to mint");
        require(_tokenIds.current() < maxSupply, "Max supply reached");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, _tokenURI);

        if (_tokenIds.current() == maxSupply) {
            emit MaxSupplyReached(_tokenIds.current());
        }
    }

    // New function to mint a specific tokenId
    function mintSpecific(uint256 tokenId, string memory _tokenURI) public payable {
        require(msg.value >= cost, "Insufficient funds to mint");
        require(_tokenIds.current() < maxSupply, "Max supply reached");
        require(!_exists(tokenId), "Token already minted");
        require(tokenId > 0 && tokenId <= maxSupply, "Token ID out of range");

        _tokenIds.increment(); // Still increment to track total minted
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        if (_tokenIds.current() == maxSupply) {
            emit MaxSupplyReached(_tokenIds.current());
        }
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseURIString; // Updated to use renamed variable
    }

    // Public accessor for baseURI
    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseURIString = newBaseURI; // Updated to use renamed variable
        emit BaseURIUpdated(newBaseURI); 
    }

    function totalSupply() public view override(ERC721Enumerable) returns (uint256) {
        return _tokenIds.current(); // Updated to use _tokenIds for consistency
    }

    function withdraw() public onlyOwner nonReentrant { 
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        emit OwnershipTransferred(owner, newOwner); 
        owner = newOwner;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) 
        internal 
        override(ERC721, ERC721Enumerable) 
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721Enumerable) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(_exists(tokenId), "ERC721: invalid token ID"); 
        return string(abi.encodePacked(_baseURIString, Strings.toString(tokenId), ".json")); // Updated variable name
    }

    function tokenOfOwnerByIndex(address _owner, uint256 index) 
        public 
        view 
        override(ERC721Enumerable) 
        returns (uint256) 
    {
        return super.tokenOfOwnerByIndex(_owner, index);
    }

    function tokenByIndex(uint256 index) 
        public 
        view 
        override(ERC721Enumerable) 
        returns (uint256) 
    {
        return super.tokenByIndex(index);
    }
}
