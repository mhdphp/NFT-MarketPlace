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


export default function MyAssets() {
  const [nfts, setNFTs] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')

  useEffect(() =>{
    loadNFTs()
  }, [])

  async function loadNFTs() {
    // what we want to load:
    // we to get the msg.sender to display the owned nfts for this caller
     // 1. connect to the blockchain, connect to Metamask wallet using the account as signer
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
   
    // get the nftContract and marketContract
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider)
    // connect to the marketContract as the signer (the Metamask account)
    const marketContract = new ethers.Contract(nftMarketAddress, KBMarket.abi, signer)
    // get all the tokens - nfts
    const data = await marketContract.fetchMyNFTs()

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
        sold: i.sold,
        tokenIPFS_URI
      }
      return item
    }))

    setNFTs(items) // set the nfts
    setLoadingState('loaded')
  }

  // check if the nfts array is 0 after the loading process is finished
  if(loadingState === 'loaded' && !nfts.length) return (<h1
    className='px-20 py-7 text-4x1 font-bold'>You do not own any NFTs</h1>)


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
                  <div className='p-2'>
                    <p className='text-3x1 font-semibold'>Token Metatada on IPFS:</p>
                    <div style={{height:'20px'}}>
                      <a 
                        className=' text-rose-900 font-medium dark:hover:bg-orange-700 no-underline 
                        hover:underline hover:font-bold' 
                        href={nft.tokenIPFS_URI} 
                        target="_blank">
                          NFT Metadata on IPFS
                      </a>
                    </div>
                  </div>
                  <div className='p-4'>
                    <p className='break-words font-semibold'>Seller: {nft.seller}</p>
                    <p className='break-words font-semibold'>Owner: {nft.owner}</p>
                  </div>
                  <div className='p-4 bg-black mt-3'>
                      <p className='text-3x-1 mb-1 font-bold text-white'>{nft.price} ETH</p>
                  </div>
                </div>
              ))
            }
        </div>
      </div>
    </div>
  )
}
