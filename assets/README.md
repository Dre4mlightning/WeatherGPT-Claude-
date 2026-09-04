# assets/

Static files that aren't code — images, local fonts, icon sets, etc.

Nothing lives here yet: WeatherGPT currently draws its weather icons as inline
SVG (in `frontend/js/app.js`) and loads its typeface from Google Fonts (linked
in `frontend/index.html`). If you add local images/fonts later, drop them
here — `backend/server.js` already serves anything under this folder at
`/assets/...`.
