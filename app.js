const express = require('express');
const axios = require('axios');
const {Web3} = require('web3');

const web3 = new Web3('https://rpc-mainnet.maticvigil.com');
const contractABI = require('./abi.json'); // ABI of the smart contract
const contractAddress = "0x359c3AD611e377e050621Fb3de1C2f4411684E92"; // Address of the deployed smart contract
const contract = new web3.eth.Contract(contractABI, contractAddress);

const app = express();
const port = 8080;

// Enable CORS for all routes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://tiktoken.technicallyweb3.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/user', async (req, res) => {
  try {
    const { handle } = req.query;
    const url = `https://tokcount.com/?user=${handle}`;

    // Make a request to the target website
    const response = await axios.get(url);
    
    const jsonScript = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/)[1];
    const json = JSON.parse(jsonScript);

    const { userId, username, stats } = json.props.pageProps.userData;
    const followers = stats.followers;

    console.log("Username:", username);
    console.log("Handle:", handle);
    console.log("ID:", userId);
    console.log("Followers:", followers);

    // Create the TikTok user object
    const tiktokUser = {
      id: userId,
      username: username,
      handle: handle,
      followers: followers
    };
    
    try {
      const address = await contract.methods.getUserAccount(userId).call();
      console.log("Address for", userId,":", address);
      // Create the high-level response object
      const responseObj = {
        'tiktok-user': tiktokUser,
        'linked-wallet': address
      };
      
      // Forward the response data to the client
      res.json(responseObj);
      
    } catch (error) {
      console.error("An error occurred while calling the contract method:", error);
    }
    
    
  } catch (error) {
    // Handle any errors that occur during the proxy request
    res.status(500).send('Error occurred while fetching data');
  }
});

app.get('/stats', async (req, res) => {
try {
  const totalSupply = await contract.methods.totalSupply().call();
  console.log("Total Supply: ",totalSupply)
  const remainingSupply = await contract.methods.remainingSupply().call();
  console.log("Remaining Supply: ",remainingSupply)
  const nextHalving = await contract.methods.getNextHalving().call();
  console.log("Next Halving: ",nextHalving)
  const halvingCount = await contract.methods.getHalvingCount().call();
  console.log("Halving Count: ",halvingCount)
  const userCounter = await contract.methods.getUserCounter().call();
  console.log("Users: ",userCounter)

  const totalSupplyDec = Number(totalSupply) / 10 ** 18;
  const remainingSupplyDec = Number(remainingSupply) / 10 ** 18;
  const nextHalvingDec = Number(nextHalving) / 10 ** 18;
  const halvingCountDec = Number(halvingCount)
  const userCounterDec = Number(userCounter)

  // Create the high-level response object
  const responseObj = {
    totalSupply: totalSupplyDec,
    remainingSupply: remainingSupplyDec,
    nextHalving: nextHalvingDec,
    halvingCount: halvingCountDec,
    userCounter: userCounterDec
  };
  // Forward the response data to the client
  console.log("JSON", responseObj);
  console.log("Total Supply (Decimal):", totalSupplyDec);

  // Forward the response data to the client
  res.json(responseObj);

}catch (error) {
  // Handle any errors that occur during the stats
  res.status(500).send("500 Error:");
}
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});





// HTTPS version
// const express = require('express');
// const axios = require('axios');
// const https = require('https');
// const fs = require('fs');

// const app = express();
// const port = 3000;

// // SSL certificate and private key paths
// const privateKeyPath = '/etc/letsencrypt/live/example.com/privkey.pem';
// const certificatePath = '/etc/letsencrypt/live/example.com/cert.pem';
// const caBundlePath = '/etc/letsencrypt/live/example.com/chain.pem';

// // Read SSL certificate and private key files
// const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
// const certificate = fs.readFileSync(certificatePath, 'utf8');
// const caBundle = fs.readFileSync(caBundlePath, 'utf8');

// // HTTPS server options
// const httpsOptions = {
//   key: privateKey,
//   cert: certificate,
//   ca: caBundle
// };

// app.get('/user', async (req, res) => {
//   // Your existing code for handling the request
//   // ...

//   // Forward the response data to the client
//   res.send(userId);
// });

// // Create the HTTPS server
// const server = https.createServer(httpsOptions, app);

// // Start the server
// server.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });
