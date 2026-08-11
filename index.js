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

// Simple Cache. Usage policy results in IP Blocking, results
// Need to be cached.
const cache = new Map();

// Health check to confirm the service is in running and in good health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main endpoint: GET /geocode?query=CityName
app.get('/geocode', async (req, res) => {
  const { query } = req.query;

  // Validation: Query must exist, must be a string, and cannot be blank
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: "Missing or invalid query parameter." });
  }

  if (query.length > 200) {
    return res.status(400).json({ error: "Query parameter is too long. Maximum length is 200 characters." });
  }

  // Serve repeat lookup without calling Nominatim again
  const key = query.trim().toLowerCase();
  if (cache.has(key)) {
    return res.json(cache.get(key));
  }

  // In the case a request to Nominatim stalls out
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  // CODE VALIDATION PULL REQUEST -- > REVIEW FETCH ADDRESS -- LIMIT CHANGED FROM 1 TO 5
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=5`,
      {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    // If Nominatim itself returns an error status (rate-limited, down, etc.)
    if (!response.ok) {
      console.error(`Nominatim responded with status ${response.status}`);
      return res.status(502).json({ error: 'Geocoding provider returned an error.' });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(502).json({ error: 'GGeocoding provider returned unexpected response.' });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'No coordinates found for that location.' });
    }

    // Only return the necessary data (since API returns a comprehensive list)
    res.json({
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      fullName: data[0].display_name
    });

  } catch (error) {
    clearTimeout(timeout);

    if (error.name === 'AbortError') {
      console.error('Geocoding request timed out.');
      return res.status(504).json({ error: 'Geocoding request timed out.'});
    }

    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Failed to fetch geocoding data.'});
  }
});


// Unknown Routes: JSON, not Express's default HTML
app.use((req, res) => {
  res.status(500).json({ error: 'Endpoint not found.'})
})

app.listen(PORT, () => console.log(`Geocoder running on port ${PORT}`));