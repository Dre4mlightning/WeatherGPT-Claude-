// WeatherGPT backend — zero external dependencies (Node 18+ only, uses global fetch).
//
// Folder layout this expects (one level up from this file):
//   frontend/index.html
//   frontend/css/styles.css
//   frontend/js/app.js
//
// Why this exists:
// Calling public weather APIs straight from the browser can fail depending on how
// the frontend is loaded (file:// origin quirks, ad blockers, corporate proxies,
// strict browser privacy settings). Routing those calls through this small server
// instead means the browser only ever talks to YOUR origin (http://localhost:PORT).
// It's also the ONLY safe place to hold your WeatherAPI.com key — an API key must
// never be shipped to the browser, since anyone could read it from the page source.
//
// Setup:
//   cd backend
//   node --env-file=.env server.js      (put WEATHERAPI_KEY=... in backend/.env)
//   open http://localhost:3787

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3787;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.json': 'application/json; charset=utf-8'
};

// ---- Later: swap in real IMD / data.gov.in data -----------------------------
// data.gov.in issues a free key for several IMD datasets. Add another
// /api/... route below following the same proxy() pattern, and point
// frontend/js/app.js's fetchAll() at it instead of (or alongside) WeatherAPI.
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

function noKeyError(res) {
  return sendJSON(res, 500, {
    error: true,
    message: 'WEATHERAPI_KEY is not set on the server. Put WEATHERAPI_KEY=your-key-here in backend/.env, then restart with: node --env-file=.env server.js'
  });
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

// Serves a file from either the frontend or assets folder, refusing to
// escape those directories (basic path-traversal guard).
function serveStatic(res, rootDir, relativePath) {
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  const fullPath = path.join(rootDir, safePath);
  if (!fullPath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found: ' + relativePath);
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
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

  // ---- Live data API (proxied to WeatherAPI.com, key stays server-side) ----

  if (url.pathname === '/api/geocode') {
    if (!WEATHERAPI_KEY) return noKeyError(res);
    const name = (url.searchParams.get('name') || '').trim();
    if (!name) return sendJSON(res, 400, { error: true, message: 'missing name parameter' });
    const target = 'https://api.weatherapi.com/v1/search.json'
      + '?key=' + encodeURIComponent(WEATHERAPI_KEY)
      + '&q=' + encodeURIComponent(name);
    return proxy(res, target);
  }

  if (url.pathname === '/api/weather') {
    if (!WEATHERAPI_KEY) return noKeyError(res);
    const location = (url.searchParams.get('location') || '').trim();
    if (!location) return sendJSON(res, 400, { error: true, message: 'missing location parameter' });
    const lang = url.searchParams.get('lang') || 'en';
    const target = 'https://api.weatherapi.com/v1/forecast.json'
      + '?key=' + encodeURIComponent(WEATHERAPI_KEY)
      + '&q=' + encodeURIComponent(location)
      + '&days=3&aqi=yes&alerts=yes&lang=' + encodeURIComponent(lang);
    return proxy(res, target);
  }

  // ---- Static frontend files ----

  if (url.pathname === '/' || url.pathname === '/index.html') {
    return serveStatic(res, FRONTEND_DIR, 'index.html');
  }
  if (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/')) {
    return serveStatic(res, FRONTEND_DIR, url.pathname);
  }
  if (url.pathname.startsWith('/assets/')) {
    return serveStatic(res, ASSETS_DIR, url.pathname.replace(/^\/assets\//, ''));
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`WeatherGPT server running → http://localhost:${PORT}`);
  console.log(`Serving frontend from: ${FRONTEND_DIR}`);
  if (WEATHERAPI_KEY) {
    console.log('Using WeatherAPI.com for live data (current + forecast + alerts + AQI in one call).');
  } else {
    console.warn('WEATHERAPI_KEY is not set — /api/geocode and /api/weather will return errors,');
    console.warn('and the frontend will fall back to offline demo data. Fix with a backend/.env file');
    console.warn('containing WEATHERAPI_KEY=your-key-here, then run: node --env-file=.env server.js');
  }
});
