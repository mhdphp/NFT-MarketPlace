import {ethers} from 'ethers'
import {useState} from 'react'
import Web3Modal from 'web3modal'
// save nft files to IPFS
import {create as ipfsHttpClient} from 'ipfs-http-client'
import { nftaddress, nftmarketaddress } from '../config'
import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import {useRouter} from 'next/router'
import KBMarket from '../artifacts/contracts/KBMarket.sol/KBMarket.json'

// in this component we set the ipfs up to host our nft data of file storage
// using infura project setup

// get the IPFS client using infura api
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

export default function MintItem() {
    // the fileUrl is set to null
    const [fileUrl, setFileUrl] = useState(null)
    // formInput object initiation in useState (price, name, description) - NFT file in IPFS
    const [formInput, updateFormInput] = useState({price: '', name:'', description:''})
    const router = useRouter()

    // set up a function to fireoff when we update files in our form - we can add our 
    // NFT images - IPFS
    // add nft file to IPFS when event happening
    async function onChange(e) {
        const file = e.target.files[0]
        try {
            const added = await client.add(
                file, {
                    progress: (prog) => console.log(`received: ${prog}`)
                })
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            
            // update fileUrl state
            setFileUrl(url)
            
        } catch (error) {
            console.log('Error uploading file:', error)
        }
    }

    

}