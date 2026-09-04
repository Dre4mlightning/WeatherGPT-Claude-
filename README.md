# WeatherGPT

A conversational weather assistant prototype for **SIH26068** (Ministry of
Earth Sciences), backed by live data from WeatherAPI.com — current
conditions, forecast, government hazard alerts, and air quality.

## Folder structure

```
weathergpt/
├── backend/
│   ├── server.js         ← Node server: serves the frontend + proxies live data
│   └── .env.example      ← copy to .env and add your WeatherAPI.com key here
├── frontend/
│   ├── index.html        ← page structure
│   ├── css/
│   │   └── styles.css    ← all styling
│   └── js/
│       └── app.js        ← chat logic, data fetching, i18n, UI updates
├── assets/                ← images/icons/local fonts, if you add any later
├── package.json           ← optional convenience: `npm start`
└── README.md
```

Splitting it this way means: change look and feel → `frontend/css/styles.css`.
Change chat behaviour, intents, or how data is displayed → `frontend/js/app.js`.
Change what data source is used or add new API routes → `backend/server.js`.
Page structure/markup → `frontend/index.html`. They don't need to touch each
other for most changes.

## Setup

1. Get a free key at **https://www.weatherapi.com/** (dashboard → API key).
   Free tier: 1,000,000 calls/month, no credit card required.

2. In the `backend/` folder, copy `.env.example` to a new file named `.env`,
   and put your real key in it:
   ```
   WEATHERAPI_KEY=your-key-here
   ```
   (No quotes, no `export`, no semicolon — just that one line.)

3. You need Node.js 18+ (check with `node --version`).

## Running it

**Option A — from the project root (recommended):**
```
npm start
```

**Option B — manually, from inside backend/:**
```
cd backend
node --env-file=.env server.js
```

Either way, once you see `WeatherGPT server running → http://localhost:3787`,
open that URL in your browser (not any `.html` file directly — the server
needs to be the one serving it, both for the static files and for live data
to work).

## If it's showing "Demo data (offline)" instead of live data

- Confirm `backend/.env` exists and has the line `WEATHERAPI_KEY=...` with
  your actual key, no placeholder text left in it.
- Make sure you started the server *after* saving `.env` — it's only read at
  startup.
- Open the browser console (F12) — failed live calls log the real reason,
  e.g. `Fetch attempt failed: /api/weather → ...`.
- Test the proxy directly: `curl "http://localhost:3787/api/geocode?name=Delhi"`
  should return a JSON array of matching locations, not an `{"error":true,...}`
  object. If you get the error object, the message it contains says why
  (missing key, invalid key, quota exceeded, no internet, etc).

## Integrating real IMD / MoES data later

WeatherAPI.com is a global forecast model, not official IMD data. For a SIH
submission that needs to be IMD-grounded:

1. Apply for IMD datasets via **data.gov.in** (search "India Meteorological
   Department"). Some products (nowcasts, cyclone e-atlas, Damini lightning)
   may need a direct request to MoES/IMD rather than a self-serve key.
2. Add another route in `backend/server.js` (same `proxy()` pattern), reading
   an `IMD_API_KEY` from `.env` — never hardcode it.
3. Reshape its response into the same normalized shape `frontend/js/app.js`
   already expects (see `parseWeatherApi()` in that file for the pattern):
   ```js
   {
     place: { name, admin, lat, lon },
     current: { tempC, feelsC, humidity, windKph, windDir, pressureMb, conditionText },
     today: { maxC, minC, rainChance },
     tomorrow: { maxC, minC, rainChance },
     aqi: { usEpaIndex, pm25 } | null,
     alerts: [ { event, headline, areas, severity, effective, expires, desc } ]
   }
   ```
4. To deploy somewhere judges can reach (instead of your laptop), host the
   `backend/` folder on something like Render or Railway — no code changes
   needed, just make sure `WEATHERAPI_KEY` is set as an environment variable
   on that platform, and it will serve `frontend/` the same way.

## Note on `.env`

Never commit or share your real `.env` file — it has your API key in it. If
you set up git for this project, add a `.gitignore` file containing:
```
.env
node_modules/
```
