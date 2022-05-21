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
        nft.mintToken('http--t1'); // tokenId = 1, automatic
        nft.mintToken('http--t2'); // tokenId = 2, automatic

        // put nft to market
        await market.makeMarketItem(nftContractAddress, 1, auctionPrice, {value: listingPrice});
        await market.makeMarketItem(nftContractAddress, 2, auctionPrice, {value: listingPrice});

        // test for different addresses from different users - test accounts
        // return an array of addresses
        const[_, buyerAddress] = await ethers.getSigners();

        // create a market sale, with id and address
        await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {value: auctionPrice});

        // test all the items
        const items = await market.fetchMarketTokens();
        console.log('items', items);
    });
});
