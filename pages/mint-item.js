import {ethers} from 'ethers'
import {useState} from 'react'
import Web3Modal from 'web3modal'
// save nft files to IPFS
import {create as ipfsHttpClient} from 'ipfs-http-client'
import { nftAddress, nftMarketAddress } from '../config'
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
    // formInput object initiation in useState (price, name, description)
    // there will be 3 inputs price, name and description - inserted by the user Front-End
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


    async function createMarket() {
        const {name, description, price} = formInput // from useState
        if(!name || !description || !price || !fileUrl) return 
        // upload to IPFS
        const data = JSON.stringify({ name, description, image: fileUrl })
        try {
            const added = await client.add(data)
            const url = `https://ipfs.infura.io/ipfs/${added.path}`
            // run a function that creates sale and passes in the url 
            createSale(url)
            } catch (error) {
                console.log('Error uploading file:', error)
            }
    }

    async function createSale(url) {
        // 1. connect to the blockchain, get an account from blockchain host provider
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)
        const signer = provider.getSigner()

        // 2. Create the token (nft)
        // connect to the NFT.sol contract with the account - signer
        let contract = new ethers.Contract(nftAddress, NFT.abi, signer)
        // mint token (nft) - access the function of NFT.sol contract
        let transaction = await contract.mintToken(url)
        let tx = await transaction.wait()
        let event = tx.events[0]
        let value = event.args[2]
        // get nft tokenId
        let tokenId = value.toNumber()
        // get the price from formInput and formated into 'ether'
        const price = ethers.utils.parseUnits(formInput.price, 'ether')
        
        // 3. List the token (nft) to market
        // connect to the KBMarket.sol contract with signer account
        contract = new ethers.Contract(nftMarketAddress, KBMarket.abi, signer)
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString()
        // list the token (nft) to market - access the makeMarketItem() from KBMarket.sol contract
        transaction = await contract.makeMarketItem(nftAddress, tokenId, price, {value: listingPrice})
        await transaction.wait()
        router.push('./')
    }

    return(
        <div className='flex justify-center'>
            <div className='w-1/2 flex flex-col pb-12'>
            <input
                placeholder='Asset Name'
                className='mt-8 border rounded p-4'
                // using spread operator for updating the state - formInput, when input is changing
                onChange={ e => updateFormInput({...formInput, name: e.target.value})} 
            />
            <textarea
                placeholder='Asset Description'
                className='mt-2 border rounded p-4'
                onChange={ e => updateFormInput({...formInput, description: e.target.value})} 
            />
            <input
                placeholder='Asset Price in Eth'
                className='mt-2 border rounded p-4'
                onChange={ e => updateFormInput({...formInput, price: e.target.value})} 
            />
            <input
                type='file'
                name='Asset'
                className='mt-4'
                // call the function onChange
                onChange={onChange} 
            />
            {/* ternary operator - only true */}
            {fileUrl && (
                <img className='rounded mt-4' width='350px' src={fileUrl} />
            )}
            <button onClick={createMarket}
                className='font-bold mt-4 bg-purple-500 text-white rounded p-4 shadow-lg'>
                    Mint NFT
            </button>
            </div>
        </div>
    )

}