require("@nomiclabs/hardhat-waffle");
require('dotenv').config();
const projectID = process.env.INFURA_PROJECT_ID
const privateKEY = process.env.PKEY


module.exports = {
  defaultNetwork: 'hardhat',
  hardhat:{
    chainId: 1337 // config standard
  },
  mumbai:{
    url: `https://polygon-mumbai.infura.io/v3/${projectID}`,
    accounts: [privateKEY]
  },
  mainnet: {
    url: `https://mainnet.infura.io/v3/${projectID}`,
    accounts: [privateKEY]
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
