const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Contracts", function () {
    it("Should return the address once the contracts are deployed", async function () {
        // compile the KBMarket.sol
        const Market = await ethers.getContractFactory("KBMarket");
        // deploy the contract
        const market = await Market.deploy();
        // get the contract data
        await market.deployed();
        // get the address of the contract deployed
        const marketContractAddress = market.address;

        // compile the NFT.sol
        const NFT = await ethers.getContractFactory("NFT");
        // deploy the contract
        const nft = await NFT.deploy(marketContractAddress);
        // get the contract data
        await nft.deployed();
        // get the address of the contract deployed
        const nftContractAddress = nft.address;

        // get the listing price
        let listingPrice = await market.getListingPrice();
        // parse it to string
        listingPrice = listingPrice.toString();

        // setup the auction price
        const auctionPrice = ethers.utils.parseUnits('55', 'ether');

        // test for minting
        nft.mintToken('http--t1'); // tokenId = 1, automatic, tokenURI is 'http--t1'
        nft.mintToken('http--t2'); // tokenId = 2, automatic, tokenURI is 'http--t2'

        // put nft to market
        await market.makeMarketItem(nftContractAddress, 1, auctionPrice, {value: listingPrice});
        await market.makeMarketItem(nftContractAddress, 2, auctionPrice, {value: listingPrice});

        // test for different addresses from different users - test accounts
        // return an array of addresses, owner address and contract address 
        // const[_, buyerAddress] = await ethers.getSigners();

        // create a market sale, with id=1 and address, using the buyerAddress
        // await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {value: auctionPrice});

        // test all the items
        // items is an array of MarketToken struct
        // // return the number of unsold items an array of MarketToken
        let items = await market.fetchMarketTokens();

        // each object of the array is a MarkenToken struct
        items = await Promise.all(items.map(async i =>{
            //
            let tokenURI = await nft.tokenURI(i.tokenId);
            let item = {
                price   :   i.price.toString(), // for making the price readeable
                tokenId :   i.tokenId.toString(),
                seller  :   i.seller,
                owner   :   i.owner,
                tokenURI
            }
            return item
        }));
        console.log('unsold_items', items);
    });
});
