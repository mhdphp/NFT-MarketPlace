// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import openzepellin  NFT functionality
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract NFT is ERC721URIStorage {
    // using a library for safe math
    using Counters for Counters.Counter;
    
    // Counters.Counter allow us to keep track of tokenIds
    Counters.Counter private _tokenIds;
    
    // address of marketplace for NFTs to interact
    address contractAddress;

    // obj: give the NFT market the ability to transact with tokens or change ownership
    // setApprovalForAll allows us to do with contract address

    // constructor of ERC721
    // constructor(string memory name_, string memory symbol_) {
    //     _name = name_;
    //     _symbol = symbol_;
    // }

    // constructor  setup name, symbol (from ERC721 constructor) and marketAddress
    constructor(address marketAddress) ERC721('KryptoBirdz','KBIRDZ') {
        contractAddress = marketAddress;
    }

    // mint function, give access to all the parameters of the image
    // contract address, tokenId, image URI
    function mintToken(string memory tokenURI) public returns(uint) {
        // increment the tokenIds
        _tokenIds.increment();
        // assign the current token id - after incremented
        uint256 newItemId = _tokenIds.current();
        // mint the image - the mint inherited function takes two args caller address, and token id
        _mint(msg.sender, newItemId);
        // set the token URI - inherited function that takes two args token id and token URI
        _setTokenURI(newItemId, tokenURI);
        // give the market the approval to transact
        setApprovalForAll(contractAddress, true);
        // return the new minted tokenId
        return newItemId;
    }

}