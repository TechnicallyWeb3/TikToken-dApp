const express = require('express');
const axios = require('axios');

const app = express();
const port = 8080;

app.get('/user', async (req, res) => {
  try {
    const { handle } = req.query;
    const url = `https://tokcount.com/?user=${handle}`;

    // Make a request to the target website
    const response = await axios.get(url);
    
    const jsonScript = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/)[1];
    const json = JSON.parse(jsonScript);

    const { userId, username } = json.props.pageProps.userData;

    console.log("Username:", username);
    console.log("Handle:", handle);
    console.log("ID:", userId);

    // Forward the response data to the client
    res.send(userId);
  } catch (error) {
    // Handle any errors that occur during the proxy request
    res.status(500).send('Error occurred while fetching data');
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
