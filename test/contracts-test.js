const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Contracts", function () {
    let Market, market, NFT, nft, marketContractAddress, nftContractAddress;
    let listingPrice, auctionPrice, marketContractOwner;
    let owner, buyer1, buyer2;
    let ownerAddress, buyer1Address, buyer2Address;

    before( async() =>{
        // load contracts
        // compile the KBMarket.sol
        Market = await ethers.getContractFactory("KBMarket");
        // deploy the contract
        market = await Market.deploy();
        // get the contract data
        await market.deployed();
        // get the address of the contract deployed
        marketContractAddress = market.address;
        // get the owner of the KBMarket.sol contract
        marketContractOwner = await market.getOwner();

        // compile the NFT.sol
       NFT = await ethers.getContractFactory("NFT");
        // deploy the contract
        nft = await NFT.deploy(marketContractAddress);
        // get the contract data
        await nft.deployed();
        nftContractAddress = nft.address;

        // setup the auction price to 55 Ether
        auctionPrice = ethers.utils.parseUnits('55', 'ether');
        // parse it to string
        auctionPrice = auctionPrice.toString();

        // get the listing price for each item brought to the market
        listingPrice = await market.getListingPrice();
        // parse it to string
        listingPrice = listingPrice.toString();

        const [owner, buyer1, buyer2] = await ethers.getSigners();
        ownerAddress = owner.address;
        buyer1Address = buyer1.address;
        buyer2Address = buyer2.address;
        console.log('buyer1Address: ', buyer1Address);
        console.log('buyer2Address: ', buyer2Address);
        console.log('ownerAddress:', ownerAddress);
        
        // mint 3 tokens
        await nft.mintToken('http--t1'); // tokenId = 1, automatic, tokenURI is 'http--t1'
        await nft.mintToken('http--t2'); // tokenId = 2, automatic, tokenURI is 'http--t2'
        await nft.mintToken('http--t3'); // tokenId = 3, automatic, tokenURI is 'http--t3'

        // bring the tokens to the market
        await market.makeMarketItem(nftContractAddress, 1, auctionPrice, {value: listingPrice})
        await market.makeMarketItem(nftContractAddress, 2, auctionPrice, {value: listingPrice})
        await market.makeMarketItem(nftContractAddress, 3, auctionPrice, {value: listingPrice})
    });

    it("Should return the address once the contracts are deployed", async function () {
        console.log();
        console.log('KBMarket Contract Address: ', marketContractAddress);
        console.log('NFT Contract Address: ', nftContractAddress);
    });

    it("Should return the listingPrice and auctionPrice", async function (){
        console.log();
        console.log('listingPrice: ', listingPrice);
        console.log('auctionPrice: ', auctionPrice);
        // console.log('nft contract:', nft);
        assert.equal('55000000000000000000', auctionPrice);
        assert.equal('45000000000000000', listingPrice);
    });

    it("Should return the list of all minted nfts", async function(){
        let items = await market.fetchItemsCreated();
        items = await Promise.all(items.map(async i =>{
            let tokenURI = await nft.tokenURI(i.tokenId);
            let item = {
                nftContractAddress: i.nftContract,
                price   :   i.price.toString(), // for making the price readeable
                tokenId :   i.tokenId.toString(),
                seller  :   i.seller,
                owner   :   i.owner,
                tokenURI
            }
            return item
        }));
        console.log('items-nfts created:', items);
    });
        
    it("Should return nftURI for first nftItem, and tokenAddress", async function(){
        // test for minting
        let testURI = 'http--t1';
        // get nftId 
        let currentId = '1';
        // get nftURI
        let currentURI = await nft.tokenURI(currentId);
        let tokenAddress = await nft.address;
        console.log();
        console.log('nftURI, nftId', currentURI, currentId);
        console.log('tokenAddress: ', tokenAddress);
        assert.equal(testURI, currentURI);
        assert.equal(nftContractAddress, tokenAddress);
    });

    it("Should return all the unsold nft items", async function(){
        // return number of unsold nft in format of an object (MarketToken)
        let items = await market.fetchMarketTokens();

        // each object of the array is a MarkenToken struct / javascript object
        items = await Promise.all(items.map(async i =>{
            let tokenURI = await nft.tokenURI(i.tokenId);
            let item = {
                nftContractAddress: i.nftContract,
                price   :   i.price.toString(), // for making the price readeable
                tokenId :   i.tokenId.toString(),
                seller  :   i.seller,
                owner   :   i.owner,
                tokenURI
            }
            return item
        }));
        console.log('unsold items: ', items);
        console.log('owner of KBMarket.sol contract: ', marketContractOwner);
    }); 
    
    it("Should return the sold items-nfts",async function(){
        const[owner, buyer1, buyer2, buyer3] = await ethers.getSigners();
        // sale to buyer 1 all the 3 nfts (items)
        await market.connect(buyer1).createMarketSale(nftContractAddress, 1, {value: auctionPrice});
        await market.connect(buyer1).createMarketSale(nftContractAddress, 2, {value: auctionPrice});
        await market.connect(buyer2).createMarketSale(nftContractAddress, 3, {value: auctionPrice});

        let items = await market.fetchItemsCreated();
        items = await Promise.all(items.map(async i =>{
            let tokenURI = await nft.tokenURI(i.tokenId);
            let item = {
                nftContractAddress: i.nftContract,
                price   :   i.price.toString(), // for making the price readeable
                tokenId :   i.tokenId.toString(),
                seller  :   i.seller,
                owner   :   i.owner,
                tokenURI
            }
            return item
        }));
        console.log('items-nfts sold:', items);
    });

    it("Should return the sold items to buyer1", async function(){
        const[owner, buyer1, buyer2] = await ethers.getSigners();
        let items = await market.connect(buyer1).fetchMyNFTs();
        items = await Promise.all(items.map(async i =>{
            let tokenURI = await nft.tokenURI(i.tokenId);
            let item = {
                nftContractAddress: i.nftContract,
                price   :   i.price.toString(), // for making the price readeable
                tokenId :   i.tokenId.toString(),
                seller  :   i.seller,
                owner   :   i.owner,
                tokenURI
            }
            return item
        }));
        console.log('items-nfts sold to buyer1:', items);
    });

});
