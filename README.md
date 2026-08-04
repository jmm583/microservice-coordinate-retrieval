# Coordinate Retrieval Microservice

## Description

This microservice is part of the CS 361 Term Project for Team Microservice Masters.
The microservice communicates with the OpenStreetMap Nominatim API. It accepts the name of a city or state and returns the geographic coordinates (latitude and longitude) for that location, along with a display name.

The main programs (client applications) will call this microservice. The MS will then make the request to the Nominatim API, parse through all the data it gets back in the response, and return only the necessary information in JSON format (which would be latitude, longitude, and display name of the location).
The Nominatim API does require a custom `User-Agent` header as well as rate-limit compliance (no more than 1 call to the API per second per application). We implemented the microservice with these things in mind and even implemented caching as well.

## How to REQUEST Data

Send an HTTP `GET` request to the `/geocode` endpoint with a `query` parameter containing the city and/or the state name you want coordinates for. 

**Endpoint:**
```
GET http://localhost:3001/geocode?query=<location name>
```

**NOTE:** `localhost:3001` refers to *your own* locally running copy of this microservice. It is not currently hosted anywhere, so each person runs their own instance locally (see "Running the Microservice Locally" below for further info). Once the services are deployed, this section will be updated with the shared/hosted URL.

**Parameters:**

- Parameter: `query`
- Type: string
- Required: Yes
- Description: A city and/or state name, URL-encoded

**Example call (JavaScript / fetch):**
```
const response = await fetch('http://localhost:3001/geocode?query=Seattle,%20WA');
const data = await response.json();
```

**Example call (curl):**
```
curl "http://localhost:3001/geocode?query=Seattle,%20WA"
```

## How to RECEIVE Data

The microservice responds with a `200 OK` and a JSON object containing the coordinates and a normalized location name when it makes a successful call. 

**Example successful response (JSON):**
```
{
  "lat": 47.6038321,
  "lon": -122.3300624,
  "fullName": "Seattle, King County, Washington, United States"
}
```

**Example call and receive together (JavaScript / fetch):**
```
async function getCoordinates(locationName) {
  const response = await fetch(
    `http://localhost:3001/geocode?query=${encodeURIComponent(locationName)}`
  );
  const data = await response.json();

  if (response.ok) {
    console.log(`Coordinates for ${locationName}:`, data.lat, data.lon);
  } else {
    console.error('Error:', data.error);
  }

  return data;
}

getCoordinates('Portland, OR);
```

**Possible response statuses:**

- 200: Success - coordinates found and returned
- 400: Missing or invalid `query` parameter
- 404: No coordinates found for the given location
- 500: Unexpected server error
- 502: Nominatim API returned an error
- 504: Request to Nominatim API timed out

**Example error response (JSON):**
```
{
  "error": "No coordinates found for that location."
}
```

## Running the Microservice Locally

1. **Clone this repo** and navigate into it (the main directory is called "coordinate-retrieval-microservice").
2. **Install dependencies using "npm install" (bash) in the terminal of your IDE**
3. **Create a `.env` file** in the project root (this file was not included in the repo). Anyone running this locally needs to create their own. All you need to add to the `.env` file is the below (replace the email with your own):
```
PORT=3001
NOMINATIM_USER_AGENT=OSU-CS361TermProject-CoordinateService/1.0 (contact: email@oregonstate.edu)
```
This is required by OpenStreetMaps organization in order to use the API. They require a custom `User-Agent` header which can be anything but typically includes the name of the application and a way to get in contact with the developer. If a generic `User-Agent` header is detected, the API may refuse to work.

4. **Start the server (the below is bash):**
```
node index.js
```
You will see: `Geocoder running on port 3001`

5. **Verify it's running** by going to `http://localhost:3001/health` in a web browser. Or by making a request to `.geocode` as shown above. 

## UML Sequence Diagram

<img width="407" height="480" alt="sequence (1)" src="https://github.com/user-attachments/assets/efa712ed-14e3-45e8-b418-bbbc43b75b64" />



