import '../styles/globals.css'
import './app.css'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import detectEthereumProvider from '@metamask/detect-provider'

function KryptoBirdMarketplace({Component, pageProps}) {

  const [account, setAccount] = useState('0x0');

  useEffect(() =>{
    loadWeb3()
    getAccounts()
  })

  // connect to the metamask wallet (provider)
  async function loadWeb3() {
    const provider = await detectEthereumProvider();
    if (provider) {
        console.log('there is an ethereum provider - aka wallet');
        window.web3 = new Web3(provider);
        await window.ethereum.enable(); 
    } else {
        console.log('No ethereum provider - wallet detected.');
    }
  }

  async function getAccounts(){
    // get the Metamask accounts, and select the index-0 - the connected one
    // save it to the account State variable
    window.ethereum.request({method:'eth_requestAccounts'})
    .then(accounts=>{
        let currentAccount = accounts[0]
        // console.log(currentAccount)
        setAccount(currentAccount)
    })
  }


  return(
    <div>
      <nav className='border-b p-6' style={{backgroundColor:'purple'}}>
        <p className='text-4x1 font-bold text-white'>KryptoBird Marketplace</p>
        <div className='flex mt-4 justify-center'>
          <Link href='/'>
            <a className='mr-4 font-bold'>
              Main Marketplace
            </a>
          </Link>
          <Link href='/mint-item'>
            <a className='mr-6 font-bold'>
              Mint Tokens
            </a>
          </Link>
          <Link href='/my-nfts'>
            <a className='mr-6 font-bold'>
              My NFts
            </a>
          </Link>
          <Link href='/account-dashboard'>
            <a className='mr-6 font-bold'>
              Account Dashboard
            </a>
          </Link>
        </div>
        <div className='flex mt-4 justify-center'>
          <p className='font-bold' style={{color:'black'}}>Acount: {account} </p>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}


export default KryptoBirdMarketplace
