// WeatherGPT backend — zero external dependencies (Node 18+ only, uses global fetch).
//
// Why this exists:
// Calling public weather APIs straight from the browser can fail depending on how
// the HTML file is opened (file:// origin quirks, ad blockers, corporate proxies,
// strict browser privacy settings). Routing those calls through this small server
// instead means the browser only ever talks to YOUR origin (http://localhost:PORT),
// which sidesteps that whole class of problem — and it's also the correct place to
// plug in a real IMD / data.gov.in API key later, since that key must never be
// shipped to the browser.
//
// Run:   node server.js
// Open:  http://localhost:3787

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3787;
const HTML_FILE = path.join(__dirname, 'weathergpt.html');

// ---- Swap-in point for real IMD / data.gov.in data -------------------------
// data.gov.in issues a free API key for several IMD datasets (current weather,
// city forecast, etc). Once you have one:
//   1. Put it in an environment variable, never in code:
//        export IMD_API_KEY="your-key-here"
//   2. Replace the body of proxyWeather() below with a call to the IMD endpoint,
//      reshaping its response into the same {current:{...}, daily:{...}} shape
//      the frontend already expects (see WMO-code mapping notes in weathergpt.html)
//      — or reshape it however you like and update the frontend's fetchWeather()
//      to match.
// const IMD_API_KEY = process.env.IMD_API_KEY;
// -----------------------------------------------------------------------------

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

async function proxy(res, upstreamUrl) {
  try {
    const upstream = await fetch(upstreamUrl, { signal: AbortSignal.timeout(8000) });
    const data = await upstream.json();
    sendJSON(res, upstream.ok ? 200 : 502, data);
  } catch (err) {
    sendJSON(res, 502, { error: true, message: err.message || 'upstream fetch failed' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (url.pathname === '/api/geocode') {
    const name = url.searchParams.get('name') || '';
    const target = 'https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=' + encodeURIComponent(name);
    return proxy(res, target);
  }

  if (url.pathname === '/api/weather') {
    const qs = url.searchParams.toString();
    const target = 'https://api.open-meteo.com/v1/forecast?' + qs;
    return proxy(res, target);
  }

  if (url.pathname === '/api/aqi') {
    const qs = url.searchParams.toString();
    const target = 'https://air-quality-api.open-meteo.com/v1/air-quality?' + qs;
    return proxy(res, target);
  }

  if (url.pathname === '/' || url.pathname === '/weathergpt.html' || url.pathname === '/index.html') {
    fs.readFile(HTML_FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Could not read weathergpt.html — make sure it is in the same folder as server.js.');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`WeatherGPT server running → http://localhost:${PORT}`);
  console.log('Proxying live data via /api/geocode, /api/weather, /api/aqi');
});
