import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import {nftMarketAddress, nftAddress} from '../config.js'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import KBMarket from '../artifacts/contracts/KBMarket.sol/KBMarket.json'


export default function Home() {
  const [nfts, setNFTs] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')


  useEffect(() =>{
    loadNFTs()
  }, [])


  async function loadNFTs() {
    // what we want to load:
    // ***provider, tokenContract, marketContract, data for our marketItems***

    // get the connection with blockchain
    const provider = new ethers.providers.JsonRpcProvider()
    // get the nftContract and marketContract
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftMarketAddress, KBMarket.abi, provider)
    // get all the tokens - nfts
    const data = await marketContract.fetchMarketTokens()

    const items = await Promise.all(data.map(async i => {
      // get the tokenUri
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const sigIPFS = tokenUri.split("/").pop()
      const tokenIPFS_URI = "https://ipfs.infura.io/ipfs/" + sigIPFS;
      // we want get the token metadata - json from the nft URI
      const meta = await axios.get(tokenUri)

      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')

      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image, 
        name: meta.data.name,
        description: meta.data.description,
        tokenIPFS_URI
      }
      return item
    }))

    setNFTs(items) // set the nfts
    setLoadingState('loaded')
  }

  // function to buy nfts for market 
  async function buyNFT(nft) {
    const web3Modal = new Web3Modal() // library to detect browse based wallets
    const connection = await web3Modal.connect() // connect to the active wallet Metamask in our case
    const provider = new ethers.providers.Web3Provider(connection)
    // get signer - caller of the contract
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftMarketAddress, KBMarket.abi, signer)

    // convert price to readable string
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
    // call the createMarketSale() function from the contract
    const transaction = await contract.createMarketSale(nftAddress, nft.tokenId, {
      value: price
    })
    await transaction.wait()
    loadNFTs()
  }
  // check if the nfts array is 0 after the loading process is finished
  if(loadingState === 'loaded' && !nfts.length) return (<h1
    className='px-20 py-7 text-4x1 font-bold'>No NFts in Marketplace</h1>)


  return (
    <div className='flex justify-center'>
      <div className='px-4' style={{maxWidth: '1600px'}}>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
            {
              nfts.map((nft, i)=>(
                <div key={i} className='border shadow rounded-x1 overflow-hidden'>
                  <img src={nft.image} />
                  <div className='p-4'>
                    <p style={{height:'64px'}} className='text-3x1 font-semibold'>{nft.name}</p>
                    <div style={{height:'72px', overflow:'hidden'}}>
                      <p className='text-gray-400'>{nft.description}</p>
                    </div>
                  </div>
                  {/* display the infura / ipfs URI for metadata */}
                  <div className='p-4'>
                    <p style={{height:'64px'}} className='text-3x1 font-semibold'>Token Metatada on IPFS</p>
                    <div style={{height:'72px'}}>
                      <a 
                        className='dark:md:hover:bg-orange-700 no-underline hover:underline hover:font-bold' 
                        href={nft.tokenIPFS_URI} 
                        target="_blank">
                          NFT Metadata on IPFS
                      </a>
                    </div>
                  </div>
                  <div className='p-4 bg-black'>
                      <p className='text-3x-1 mb-4 font-bold text-white'>{nft.price} ETH</p>
                      <button 
                        className='w-full bg-purple-500 text-white font-bold py-3 px-12 rounded'
                        onClick={()=> buyNFT(nft)} >Buy
                      </button>
                  </div>
                </div>
              ))
            }
        </div>
      </div>
    </div>
  )
}
