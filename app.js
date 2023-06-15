const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

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
