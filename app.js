const express = require('express');
const axios = require('axios');
const {Web3} = require('web3');

const web3 = new Web3('https://rpc-mainnet.maticvigil.com');
const contractABI = require('./abi.json'); // ABI of the smart contract
const { link } = require('fs');
const { error } = require('console');
const { hasSubscribers } = require('diagnostics_channel');
const contractAddress = "0x359c3AD611e377e050621Fb3de1C2f4411684E92"; // Address of the deployed smart contract
const contract = new web3.eth.Contract(contractABI, contractAddress);

const message = "Hey, I tried to send crypto to you, but you haven't registered your handle with TikToken yet, head over to technicallyweb3.com to link your wallet and I'll try again later!"

const app = express();
const port = 8080;

// Enable CORS for all routes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); //https://tiktoken.technicallyweb3.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/user', async (req, res) => {
  try {
    const { handle, id } = req.query;

    // Create the TikTok user object
    const tiktokUser = {
      id: id,
      handle: handle
    };
  
    if (!id) {
      const url = `https://tokcount.com/?user=${handle}`;
  
      // Make a request to the target website
      const response = await axios.get(url);
      
      const jsonScript = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/)[1];
      const json = JSON.parse(jsonScript);
  
      const { userId: fetchedUserId, username: fetchedUsername, signature:fetchedBio, avatar:fetchedAvatarURL, stats } = json.props.pageProps.userData;
      followers = stats.followers;
      following = stats.following;
      likes = stats.likes;
      videos = stats.videos;

  
      // Assign values to the variables
      userId = fetchedUserId;
      username = fetchedUsername;
      bio = fetchedBio
      avatarURL = fetchedAvatarURL;

      tiktokUser.id = userId;
      tiktokUser.username = username;
      tiktokUser.bio = bio;
      tiktokUser.avatarURL = avatarURL;
      tiktokUser.followers = followers;
      tiktokUser.following = following;
      tiktokUser.likes = likes;
      tiktokUser.videos = videos;

      console.log("Username:", username);
      console.log("Handle:", handle);
      console.log("Followers:", followers);

    } else {
      userId = id;
    }
  
    console.log("ID:", userId);

    hasMinted = false;

    try {
      hasMinted = await contract.methods.hasMinted(userId).call();
      //rest of code?
    } catch (error) {
      console.error("An error occurred while calling the contract method:", error);
    }
    tiktokUser.hasMinted = hasMinted
    console.log("Has Minted:", hasMinted)
    
    try {
      const address = await contract.methods.getUserAccount(userId).call();
      console.log("Address for", userId,":", address);

      const linkedWallet = {}
      
      if (address === '0x0000000000000000000000000000000000000000') {
        linkedWallet.copyMessage = message
        linkedWallet.isRegistered = false
      } else {
        linkedWallet.address = address
        linkedWallet.isRegistered = true
      }
      

      // Create the high-level response object
      const responseObj = {
        'tiktok-user': tiktokUser,
        'linked-wallet': linkedWallet
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
    const { format } = req.query;
    const decimal = await contract.methods.decimals().call();
    let decimalValues = {};
    let notationValues = {};

    const totalSupply = await contract.methods.totalSupply().call();
    const remainingSupply = await contract.methods.remainingSupply().call();
    const currentReward = await contract.methods.currentReward().call();
    const nextHalving = await contract.methods.getNextHalving().call();
    const halvingCount = await contract.methods.getHalvingCount().call();
    const userCounter = await contract.methods.getUserCounter().call();
    
    // Calculated Values
    const untilHalving = remainingSupply - nextHalving;

    // As Integers/Decimals
    const decimalDec = Number(decimal)
    const totalSupplyDec = Number(totalSupply) / 10 ** decimalDec;
    const remainingSupplyDec = Number(remainingSupply) / 10 ** decimalDec;
    const currentRewardDec = Number(currentReward) / 10 ** decimalDec;
    const nextHalvingDec = Number(nextHalving) / 10 ** decimalDec;
    const halvingCountDec = Number(halvingCount);
    const userCounterDec = Number(userCounter);

    const untilHalvingDec = Number(untilHalving) / 10 ** decimalDec;


    // Create the high-level response object
    // main info without currency format requirements
    const contractInfo = {
      userCounter: userCounterDec,
      halvingCount: halvingCountDec,
      //holders (requires sql database to log all emitted transaction events, cannot natively be inferred from the blockchain without logging or scraping)
    };
    console.log(contractInfo)

    const responseObj = {
      contractInfo: contractInfo
    } 
    // Set the format if null, default to 'all'
    const selectedFormat = format || 'all';
    console.log("Selected Format: ",selectedFormat)

    // Function to convert decimal values to subscript notation
    const convertToSubscript = (value) => {
      const str = value.toString();
      let subscript = '';
      for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode === 45) {
          // If the character is a minus sign (-)
          subscript += '&#8331;'; // U+208B (Subscript minus)
        } else if (charCode >= 48 && charCode <= 57) {
          // If the character is a number (0-9)
          subscript += '&#832' + (charCode - 48) + ';'; // U+2080 to U+2089 (Subscript 0 to 9)
        } else {
          // If the character is not a number or minus sign, use the original character
          subscript += str[i];
        }
      }
      return subscript;
    };
    // Function to convert decimal values to TikToken notation
    const convertToTikTokenNotation = (value) => {
      const valueString = value.toString().split('.')[1];
      const zeroCount = (valueString.match(/0/g) || []).length;
      const subscript = convertToSubscript(String(zeroCount) + '-');
      const remainder = valueString.slice(zeroCount);
      
      return `${'0.'}${subscript}${remainder}`; 
    };

    function removeTrailingZeros(inputString) {
      let output = inputString;
      while (output.length > 0 && (output.slice(-1) === '0' || output.slice(-1) === ',')) {
        output = output.slice(0, -1);
      }
      return output;
    }

    function addLeadingZeros(value) {
      valueDigits = value.toString().length;
      // console.log("Digits: ", valueDigits)
      if (valueDigits < 18) {        
        const leadingZeros = decimalDec - valueDigits; 
        // console.log("Leading Zeros: ", leadingZeros)

        const leadingValue = 1 * 10 ** decimalDec;
        let leadingString = leadingValue.toLocaleString();
        leadingString = leadingString.substring(2); //remove 1,
        const removeString = leadingZeros + (leadingZeros%3);
        // console.log("Remove String: ",removeString)
        leadingString = leadingString.substring(0 , removeString); //remove last digits
        // console.log("Leading String: ", leadingString)
        valueString = leadingString + value.toLocaleString();
        // console.log("Value String: ", valueString)

        return valueString
      } else {
        return value.toLocaleString()
      }
    }

    const convertToTikTokenString = (value) => {
      let leadingValue = addLeadingZeros(value)
      let valueString = removeTrailingZeros(leadingValue);      
      valueString = "0." + valueString;
      // console.log("Value String: ", valueString)
      return valueString;
    }

    // Decimal value for calculation
    if (selectedFormat === 'dec' || selectedFormat === 'all') {
      decimalValues = {
        totalSupplyDec,
        remainingSupplyDec,
        currentRewardDec,
        nextHalvingDec,
        untilHalvingDec,
      };
      responseObj.decimalValues = decimalValues
    }

    // Convert values to TikToken notation for values smaller than 0.001
    if (selectedFormat === 'notation' || selectedFormat === 'all') {
      notationValues = {
        totalSupplyNot: totalSupplyDec < 0.001 ? convertToTikTokenNotation(totalSupplyDec) : totalSupplyDec,
        remainingSupplyNot: remainingSupplyDec < 0.001 ? convertToTikTokenNotation(remainingSupplyDec) : remainingSupplyDec,
        currentRewardNot: currentRewardDec < 0.001 ? convertToTikTokenNotation(currentRewardDec) : currentRewardDec,
        nextHalvingNot: nextHalvingDec < 0.001 ? convertToTikTokenNotation(nextHalvingDec) : nextHalvingDec,
        untilHalvingNot: untilHalvingDec < 0.001 ? convertToTikTokenNotation(untilHalvingDec) : untilHalvingDec,
      };
      responseObj.notationValues = notationValues
    }
    
    // Add string format with comma separators
if (selectedFormat === 'string' || selectedFormat === 'all') {
  stringValues = {
    totalSupplyStr: convertToTikTokenString(totalSupply),
    remainingSupplyStr: convertToTikTokenString(remainingSupply),
    currentRewardStr: convertToTikTokenString(currentReward),
    nextHalvingStr: convertToTikTokenString(nextHalving),
    untilHalvingStr: convertToTikTokenString(untilHalving),
  };
  responseObj.stringValues = stringValues;
}

  // Forward the response data to the client
  console.log("JSON", responseObj);

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
