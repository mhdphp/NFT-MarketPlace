// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import openzepellin  NFT functionality
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
// security against transactions for multiple requests
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import 'hardhat/console.sol';


contract KBMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    /*
     - no of items minted, number of sale transactions,
     - list of tokens that are not sold , list of tokens sold,
     - keep track of total no of items,
     - determine who is the owner of the contract,
     - charge a listing fee so the owner of the KBMarket contract makes a commission,
     - we are deploying to matic, the API is the same
     - ether and matic/ Polygon have 18 decimals
     - however 0.05 matic/Polygon = 0.049433 US Dollar 
     - while 0.05 Ethereum = 126.520548 US Dollar (USD) 
    */

    Counters.Counter private _tokenIds;
    Counters.Counter private _tokensSold;
    address payable internal owner; // internal is the default visibility status in solidity
    uint256 internal listingPrice = 0.045 ether; // Although we are using matic/Polygon - commission    
    
    constructor() {
        owner = payable(msg.sender); // owner of this contract
    }

    struct MarketToken {
         uint itemId; // all the variable are internal by default
         address nftContract;
         uint256 tokenId;
         address payable seller;
         address payable owner;
         uint256 price;
         bool sold;
     }

     // mapping assigned an tokenIds to each struct MarketToken
     mapping(uint256 => MarketToken) private idToMarketToken;

     // listen to events from front end applications
     // indexed can be used up to 3 times in event
    event MarketTokenMinted(
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    // get owner address
    function getOwner() public view returns(address){
        return owner;
    }

    // get caller
    function getCallerAddress() public view returns(address){
        return msg.sender;
    }

    // get the listing price
    function getListingPrice() public view returns(uint256) {
        return listingPrice;
    }

    // get the currentId
    function getCurrentId() public view returns(uint256){
        return _tokenIds.current();
    }

    // get the MarketTokens based on id
    function getMarketTokens(uint256 itemId) public view returns(MarketToken memory){
        return idToMarketToken[itemId];
    }


    // function - put a nft contract to sale in this marketplace
    function makeMarketItem(address nftContract, uint tokenId, uint price) public payable nonReentrant {
        // nonReentrant is a modifier to prevent reentry attack
        require(price > 0, 'Price must be at least one wei');
        require(msg.value == listingPrice, 'Price must be equal to listing price');
        // increment the _tokenIds
        _tokenIds.increment();
        uint itemId = _tokenIds.current(); // get the current tokenId
        // putting to sale - bool no-owner
        // using mapping idToMarketToken
        idToMarketToken[itemId] = MarketToken(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender), // seller
            payable(address(0)), // owner - address(0) means that is unsold
            price,
            false // false -> unsold
        );
        // NFT transaction
        // Get the IERC721 inherited from ReentrancyGuard
        // transfer the token from the seller to this contract address (marketplace) with tokenId => itemId
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        emit MarketTokenMinted(
            itemId, 
            nftContract, 
            tokenId, 
            msg.sender, 
            address(0), 
            price, 
            false
        );
    }
    
    
    // function - create a market sale for buying and selling between the parties
    // the token is transferred to the buyer
    // this function is called by the buyer -> msg.sender
    function createMarketSale(address nftContract, uint itemId) public payable nonReentrant{
        uint price = idToMarketToken[itemId].price;
        uint tokenId = idToMarketToken[itemId].tokenId;
        require(msg.value == price, 'Pls submmit the asking price in order to continue');
        // transfer the price amount to the seller
        idToMarketToken[itemId].seller.transfer(msg.value);
        // transfer the token from this contract address to the buyer / the new owner
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        // update the idToMarketToken struct
        // the ower has changed / the status of sold is changed to true
        idToMarketToken[itemId].owner = payable(msg.sender);
        idToMarketToken[itemId].sold = true;
        // increase the no of tokens sold
        _tokensSold.increment();

        // transfer to the owner of marketplace the commission price
        payable(owner).transfer(listingPrice);
    }


    // function to fetch market items - minted
    // return the number of unsold items an array of MarketToken
    function fetchMarketTokens() public view returns(MarketToken[] memory){
        // get all the tokens number - the no start at 1
        uint itemsCount = _tokenIds.current();
        // the unsold token are the diff between:
        uint unsoldItemCount = _tokenIds.current() - _tokensSold.current();
        // initialize the currentIndex
        uint currentIndex = 0;

        // looping over the number of items created and if the item is unsold populate the array
        MarketToken[] memory items = new MarketToken[](unsoldItemCount);
        for (uint i = 0; i < itemsCount; i++ ){
            // check if the token is unsold
            if(idToMarketToken[i+1].owner == address(0)) {
                uint currentId = i + 1;
                // get the MarketToken structs currentItem - unsold
                MarketToken storage currentItem = idToMarketToken[currentId];
                // insert the currentItem in MarketToken[] items
                items[currentIndex] = currentItem;
                // increase the currentIndex with one unit
                currentIndex += 1;
            }
        }
        return items; // MarketToken[] of unsold tokens
    }


    // return the tokens that the buyer has purchased
    // the caller of the function - msg.sender - check the total tokens hold
    function fetchMyNFTs() public view returns(MarketToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        // check if the tokens are owned by the owner
        // .owner
        for (uint i = 0; i < totalItemCount; i++) {
            // check if the token belong the msg.sender - the caller of this function
            if(idToMarketToken[i+1].owner == msg.sender){
                // increase the itemCount by one unit
                // the final itemCount represents the no of tokens owned by msg.sender
                itemCount += 1;
            }
        }
        // set an array of MarketToken with the itemCount dimension
        // all the tokens - NFTs - owned by owner
        MarketToken[] memory items = new MarketToken[](itemCount); // total tokens owned by owner
        // second loop
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToMarketToken[i+1].owner == msg.sender) {
                uint currentId = idToMarketToken[i+1].itemId;
                MarketToken storage currentItem = idToMarketToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items; // return an array of MarketToken[] that belong to the caller - msg.sender
    }


    // function that returns an array of all minted and put to market nfts
    function fetchItemsCreated() public view returns(MarketToken[] memory){
        // the same as fetchMyNFTs but instead of .owner will be .seller
        uint totalItemCount = _tokenIds.current();
        // uint itemCount = 0;
        uint currentIndex = 0;

        // check if the tokens are owned by the caller of this function - msg.sender
        // for (uint i = 0; i < totalItemCount; i++) {
        //     // check if the token belong the seller
        //     if(idToMarketToken[i+1].seller == msg.sender){
        //         // increase the itemCount by one unit
        //         // the final itemCount represents the no of tokens owned by seller
        //         itemCount += 1;
        //     }
        // }
        MarketToken[] memory items = new MarketToken[](totalItemCount); // total tokens
        // second loop
        for(uint i = 0; i < totalItemCount; i++) {
            // if(idToMarketToken[i+1].seller == msg.sender) {
                uint currentId = idToMarketToken[i+1].itemId;
                MarketToken storage currentItem = idToMarketToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            // }
        }
        return items;
    }

}

