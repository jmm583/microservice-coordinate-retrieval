require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Pull the unique User-Agent header from .env instead of hardcoding it here
const USER_AGENT = process.env.NOMINATIM_USER_AGENT;

// Failsafe in case someone forgets to set up their .env file
if (!USER_AGENT) {
  console.error(
    'ERROR: NOMINATIM_USER_AGENT is not set. Create a .env file before starting the server.'
  );
  process.exit(1);
}

// Middleware
app.use(cors()); // this is needed to allow cross-origin requests from the React app
app.use(express.json());

// Health check to confirm the service is in running and in good health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main endpoint: GET /geocode?query=CityName
app.get('/geocode', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Missing 'query' parameter." });
  }

  try {
    // OpenStreetMap Nominatim API requires a unique User-Agent header
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=1`,
      {
        headers: { 'User-Agent': ''}
      }
    )
  }
}