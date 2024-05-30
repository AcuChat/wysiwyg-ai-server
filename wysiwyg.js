require('dotenv').config();
const { HOSTNAME, PORT } = process.env;

const privateKeyPath = `/etc/letsencrypt/live/${HOSTNAME}/privkey.pem`;
const fullchainPath = `/etc/letsencrypt/live/${HOSTNAME}/fullchain.pem`;

const express = require('express');
const https = require('https');
const cors = require('cors');
const fs = require('fs');

/**
 * Endpoint functions
 */
const openaiStream = require('./endpoints/openaiStream');

/**
 * Server Configuration
 */

const app = express();
app.use(express.static('public'));
app.use(express.json({limit: '200mb'})); 
app.use(cors());


/**
 * Stability Service
 */
const statbilityService = async (req, res, endpoint) => {
    try {
      await endpoint(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json('Internal server error');
    }
}

/**
 * Endpoints
 */

app.get('/', (req, res) => {
    res.send('Hello, World!');
});
app.post('/ai-stream', (req, res) => statbilityService(req, res, openaiStream.openaiStream));
app.get('/stream', (req, res) => {
  // Set the headers to keep the connection open
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');

  // Simulate a data source that streams data
  let counter = 0;
  const interval = setInterval(() => {
    counter += 1;
    res.write(`Chunk ${counter}\n`);

    if (counter >= 5) {
      clearInterval(interval);
      res.end();
    }
  }, 1000);
});

/**
 * Launch Server
 */
const httpsServer = https.createServer({
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(fullchainPath),
  }, app);
  

  httpsServer.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTPS Server running on port ${PORT}`);
});

