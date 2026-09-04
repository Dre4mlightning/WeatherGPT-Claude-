(function(){

  /* ---------------- i18n ---------------- */
  const STRINGS = {
    en: {
      heroTitle:'Ask the sky <em>anything.</em>',
      heroSub:'One conversational layer over live forecasts, nowcasts and hazard alerts — in plain language, in your language, before the weather makes the decision for you.',
      statLang:'Languages planned', statResp:'Alert response time', statOffline:'Low-bandwidth fallback',
      chatTitle:'Ask WeatherGPT', statusLive:'Live data', statusOffline:'Demo data (offline)',
      composerPlaceholder:'Try: any weather alerts for Odisha?', send:'Ask',
      instrumentTitle:'Live instrument panel',
      dTemp:'Temperature', dFeels:'Feels like', dHum:'Humidity', dWind:'Wind', dPress:'Surface pressure',
      loading:'Reading instruments…',
      aboutTitle:'About this prototype',
      aboutP1:'<b>WeatherGPT</b> is a SIH2026 concept build for PS SIH26068 (Ministry of Earth Sciences). Live data is served through WeatherAPI.com via a local proxy, which also carries government hazard alerts and air quality.',
      aboutP2:'A production deployment would replace this data layer with live <b>IMD, Mausam, Meghdoot and Damini</b> feeds, plus an LLM grounded via retrieval so every figure it states is sourced and verifiable.',
      greet:"Namaste! I'm WeatherGPT. Ask me about rain, temperature, wind, humidity, air quality or active alerts for any city — try one of the chips below or type your own question.",
      chips:['Will it rain in Mumbai tomorrow?','What\'s the AQI in Delhi right now?','Any weather alerts for Odisha?','Wind speed in Chennai today','Temperature in Shimla this week']
    },
    hi: {
      heroTitle:'आसमान से <em>कुछ भी पूछिए।</em>',
      heroSub:'लाइव पूर्वानुमान, नाउकास्ट और खतरे की चेतावनियों पर एक संवादात्मक परत — सरल भाषा में, आपकी भाषा में, मौसम के फैसला लेने से पहले।',
      statLang:'योजनाबद्ध भाषाएँ', statResp:'चेतावनी प्रतिक्रिया समय', statOffline:'लो-बैंडविड्थ फॉलबैक',
      chatTitle:'WeatherGPT से पूछें', statusLive:'लाइव डेटा', statusOffline:'डेमो डेटा (ऑफ़लाइन)',
      composerPlaceholder:'जैसे: ओडिशा के लिए कोई मौसम चेतावनी?', send:'पूछें',
      instrumentTitle:'लाइव इंस्ट्रूमेंट पैनल',
      dTemp:'तापमान', dFeels:'महसूस हो रहा', dHum:'नमी', dWind:'हवा', dPress:'सतही दबाव',
      loading:'उपकरण पढ़े जा रहे हैं…',
      aboutTitle:'इस प्रोटोटाइप के बारे में',
      aboutP1:'<b>WeatherGPT</b>, PS SIH26068 (पृथ्वी विज्ञान मंत्रालय) के लिए एक SIH2026 कॉन्सेप्ट है। लाइव डेटा एक लोकल प्रॉक्सी के ज़रिए WeatherAPI.com से आता है, जिसमें सरकारी चेतावनियाँ और वायु गुणवत्ता भी शामिल है।',
      aboutP2:'उत्पादन संस्करण में यह डेटा परत लाइव <b>IMD, मौसम, मेघदूत और दामिनी</b> फीड से बदली जाएगी, साथ ही एक ऐसा LLM जो रिट्रीवल से जुड़ा हो ताकि हर आँकड़ा स्रोत-सत्यापित हो।',
      greet:'नमस्ते! मैं WeatherGPT हूं। किसी भी शहर की बारिश, तापमान, हवा, नमी, वायु गुणवत्ता या सक्रिय चेतावनियों के बारे में पूछें — नीचे दिए गए सुझाव आज़माएं या अपना सवाल टाइप करें।',
      chips:['क्या कल मुंबई में बारिश होगी?','दिल्ली में अभी AQI क्या है?','ओडिशा के लिए कोई मौसम चेतावनी?','आज चेन्नई में हवा की गति कैसी है?','शिमला में इस हफ्ते तापमान कैसा रहेगा?']
    }
  };
  let lang = 'en';

  function applyI18n(){
    const t = STRINGS[lang];
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      if(t[key] !== undefined) el.innerHTML = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      const key = el.getAttribute('data-i18n-placeholder');
      if(t[key] !== undefined) el.setAttribute('placeholder', t[key]);
    });
    document.getElementById('chips').innerHTML = '';
    t.chips.forEach(c=>{
      const b = document.createElement('button');
      b.type='button'; b.className='chip'; b.textContent=c;
      b.addEventListener('click', ()=>{ document.getElementById('userInput').value = c; handleAsk(); });
      document.getElementById('chips').appendChild(b);
    });
    setLiveStatus(liveMode);
  }

  document.getElementById('langToggle').addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-lang]');
    if(!btn) return;
    lang = btn.getAttribute('data-lang');
    document.querySelectorAll('#langToggle button').forEach(b=>b.classList.toggle('active', b===btn));
    applyI18n();
  });

  /* ---------------- weather icons (keyed on condition text, not a numeric code) ---------------- */
  function iconSVG(conditionText){
    const t = (conditionText || '').toLowerCase();
    const stroke = '#eef4f8';
    const accent = '#49dcc9';
    const sun = `<circle cx="24" cy="24" r="9" stroke="${'#ffb648'}" stroke-width="2"/><g stroke="${'#ffb648'}" stroke-width="2" stroke-linecap="round"><path d="M24 4v5M24 39v5M4 24h5M39 24h5M9 9l3.5 3.5M35.5 35.5L39 39M39 9l-3.5 3.5M12.5 35.5L9 39"/></g>`;
    const cloud = `<path d="M14 32a7 7 0 1 1 1.4-13.86A9 9 0 0 1 33 21a6 6 0 0 1-1 11.9H14Z" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
    const rain = cloud + `<g stroke="${accent}" stroke-width="2" stroke-linecap="round"><path d="M17 37l-2 4M25 37l-2 4M33 37l-2 4"/></g>`;
    const storm = cloud + `<path d="M23 34l-4 7h5l-3 6 8-9h-5l3-4z" fill="${'#ffb648'}" stroke="${'#ffb648'}" stroke-width="1"/>`;
    const fog = `<g stroke="${stroke}" stroke-width="2" stroke-linecap="round"><path d="M8 20h32M6 27h36M10 34h28"/></g>`;
    const snow = cloud + `<g stroke="${accent}" stroke-width="2" stroke-linecap="round"><path d="M17 36v6M17 39l-3 2M17 39l3 2M25 36v6M25 39l-3 2M25 39l3 2M33 36v6M33 39l-3 2M33 39l3 2"/></g>`;
    if(t.includes('thunder')) return storm;
    if(t.includes('snow') || t.includes('sleet') || t.includes('ice')) return snow;
    if(t.includes('rain') || t.includes('drizzle') || t.includes('shower')) return rain;
    if(t.includes('fog') || t.includes('mist') || t.includes('haze')) return fog;
    if(t.includes('clear') || t.includes('sunny')) return sun;
    return cloud; // cloudy/overcast/partly cloudy/default
  }

  /* ---------------- data layer: WeatherAPI.com via local proxy, offline fallback ---------------- */
  const cache = {};
  let liveMode = true;

  function withTimeout(promise, ms){
    return Promise.race([
      promise,
      new Promise((_, reject)=> setTimeout(()=> reject(new Error('timeout after '+ms+'ms')), ms))
    ]);
  }

  function hashCode(str){
    let h = 0;
    for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }
  function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

  // Approximate climatology for major Indian cities, used only when the live
  // API is unreachable. Values drift slightly per hour so it still feels alive.
  const FALLBACK_DB = {
    delhi:       {admin:'Delhi',           lat:28.61, lon:77.21, temp:31, hum:52, wind:11, dir:'W',  press:1006, cond:'Partly cloudy'},
    mumbai:      {admin:'Maharashtra',     lat:19.08, lon:72.88, temp:29, hum:78, wind:18, dir:'WSW',press:1008, cond:'Light rain'},
    chennai:     {admin:'Tamil Nadu',      lat:13.08, lon:80.27, temp:33, hum:70, wind:14, dir:'E',  press:1007, cond:'Partly cloudy'},
    kolkata:     {admin:'West Bengal',     lat:22.57, lon:88.36, temp:32, hum:74, wind:10, dir:'S',  press:1006, cond:'Overcast'},
    bengaluru:   {admin:'Karnataka',       lat:12.97, lon:77.59, temp:24, hum:65, wind:9,  dir:'SW', press:1013, cond:'Partly cloudy'},
    bangalore:   {admin:'Karnataka',       lat:12.97, lon:77.59, temp:24, hum:65, wind:9,  dir:'SW', press:1013, cond:'Partly cloudy'},
    hyderabad:   {admin:'Telangana',       lat:17.38, lon:78.49, temp:28, hum:58, wind:12, dir:'SW', press:1010, cond:'Clear'},
    pune:        {admin:'Maharashtra',     lat:18.52, lon:73.86, temp:25, hum:68, wind:15, dir:'W',  press:1012, cond:'Light rain'},
    ahmedabad:   {admin:'Gujarat',         lat:23.02, lon:72.57, temp:34, hum:44, wind:13, dir:'W',  press:1005, cond:'Sunny'},
    jaipur:      {admin:'Rajasthan',       lat:26.91, lon:75.79, temp:33, hum:38, wind:10, dir:'NW', press:1004, cond:'Clear'},
    lucknow:     {admin:'Uttar Pradesh',   lat:26.85, lon:80.95, temp:30, hum:56, wind:8,  dir:'S',  press:1005, cond:'Partly cloudy'},
    kochi:       {admin:'Kerala',          lat:9.93,  lon:76.27, temp:28, hum:83, wind:16, dir:'WSW',press:1009, cond:'Moderate rain'},
    cochin:      {admin:'Kerala',          lat:9.93,  lon:76.27, temp:28, hum:83, wind:16, dir:'WSW',press:1009, cond:'Moderate rain'},
    shimla:      {admin:'Himachal Pradesh',lat:31.10, lon:77.17, temp:18, hum:60, wind:7,  dir:'NW', press:900,  cond:'Overcast'},
    patna:       {admin:'Bihar',           lat:25.59, lon:85.14, temp:31, hum:60, wind:9,  dir:'S',  press:1005, cond:'Partly cloudy'},
    bhopal:      {admin:'Madhya Pradesh',  lat:23.26, lon:77.41, temp:29, hum:54, wind:11, dir:'W',  press:1008, cond:'Clear'},
    guwahati:    {admin:'Assam',           lat:26.14, lon:91.74, temp:29, hum:80, wind:8,  dir:'SSE',press:1004, cond:'Moderate rain'},
    chandigarh:  {admin:'Chandigarh',      lat:30.73, lon:76.78, temp:29, hum:50, wind:10, dir:'W',  press:1006, cond:'Clear'},
    srinagar:    {admin:'Jammu and Kashmir',lat:34.08,lon:74.79, temp:14, hum:55, wind:6,  dir:'NW', press:900,  cond:'Partly cloudy'},
    goa:         {admin:'Goa',             lat:15.30, lon:74.12, temp:29, hum:82, wind:17, dir:'W',  press:1009, cond:'Moderate rain'},
    panaji:      {admin:'Goa',             lat:15.49, lon:73.83, temp:29, hum:82, wind:17, dir:'W',  press:1009, cond:'Moderate rain'},
    varanasi:    {admin:'Uttar Pradesh',   lat:25.32, lon:83.01, temp:31, hum:58, wind:8,  dir:'S',  press:1005, cond:'Partly cloudy'},
    indore:      {admin:'Madhya Pradesh',  lat:22.72, lon:75.86, temp:28, hum:52, wind:12, dir:'W',  press:1009, cond:'Clear'},
    nagpur:      {admin:'Maharashtra',     lat:21.15, lon:79.09, temp:31, hum:50, wind:10, dir:'W',  press:1008, cond:'Clear'},
    surat:       {admin:'Gujarat',         lat:21.17, lon:72.83, temp:32, hum:60, wind:14, dir:'W',  press:1007, cond:'Partly cloudy'},
    visakhapatnam:{admin:'Andhra Pradesh', lat:17.69, lon:83.22, temp:31, hum:72, wind:19, dir:'E',  press:1007, cond:'Moderate rain'},
    vizag:       {admin:'Andhra Pradesh',  lat:17.69, lon:83.22, temp:31, hum:72, wind:19, dir:'E',  press:1007, cond:'Moderate rain'},
    coimbatore:  {admin:'Tamil Nadu',      lat:11.02, lon:76.97, temp:27, hum:62, wind:10, dir:'SW', press:1011, cond:'Partly cloudy'},
    thiruvananthapuram:{admin:'Kerala',    lat:8.52,  lon:76.94, temp:29, hum:80, wind:14, dir:'W',  press:1009, cond:'Moderate rain'},
    bhubaneswar: {admin:'Odisha',          lat:20.30, lon:85.82, temp:32, hum:70, wind:12, dir:'S',  press:1006, cond:'Partly cloudy'},
    ranchi:      {admin:'Jharkhand',       lat:23.34, lon:85.31, temp:27, hum:60, wind:9,  dir:'SW', press:1007, cond:'Partly cloudy'},
    raipur:      {admin:'Chhattisgarh',    lat:21.25, lon:81.63, temp:30, hum:56, wind:9,  dir:'SW', press:1007, cond:'Clear'},
    dehradun:    {admin:'Uttarakhand',     lat:30.32, lon:78.03, temp:24, hum:62, wind:7,  dir:'NW', press:960,  cond:'Overcast'},
    amritsar:    {admin:'Punjab',          lat:31.63, lon:74.87, temp:30, hum:48, wind:9,  dir:'W',  press:1005, cond:'Clear'},
    agra:        {admin:'Uttar Pradesh',   lat:27.18, lon:78.02, temp:32, hum:48, wind:9,  dir:'W',  press:1005, cond:'Clear'},
    mysuru:      {admin:'Karnataka',       lat:12.30, lon:76.65, temp:25, hum:64, wind:8,  dir:'SW', press:1013, cond:'Partly cloudy'},
    mysore:      {admin:'Karnataka',       lat:12.30, lon:76.65, temp:25, hum:64, wind:8,  dir:'SW', press:1013, cond:'Partly cloudy'},
    puri:        {admin:'Odisha',          lat:19.80, lon:85.83, temp:30, hum:76, wind:20, dir:'E',  press:1007, cond:'Moderate rain'},
    darjeeling:  {admin:'West Bengal',     lat:27.04, lon:88.26, temp:15, hum:75, wind:6,  dir:'NW', press:850,  cond:'Fog'}
  };

  function fallbackLoc(name){
    const key = name.toLowerCase();
    const entry = FALLBACK_DB[key] || FALLBACK_DB['delhi'];
    return { name: FALLBACK_DB[key] ? capitalize(key) : name, admin: entry.admin, lat: entry.lat, lon: entry.lon, offline:true, _seed: entry };
  }

  // Builds the same normalized shape as parseWeatherApi(), so the UI never
  // needs to know whether it's looking at live or offline data.
  function buildOfflineNormalized(loc){
    const e = loc._seed || FALLBACK_DB['delhi'];
    const hourSeed = (hashCode(loc.name) + new Date().getHours()) % 11 - 5; // -5..+5
    const temp = e.temp + hourSeed * 0.4;
    const hum = Math.min(97, Math.max(15, e.hum + hourSeed));
    const wind = Math.max(2, e.wind + (hourSeed % 3));
    const press = e.press + Math.round(hourSeed * 0.6);
    const isRainy = /rain|shower|drizzle|thunder/i.test(e.cond);
    const p0 = isRainy ? 55 + Math.abs(hourSeed)*4 : 15 + Math.abs(hourSeed)*3;
    const p1 = Math.min(95, p0 + 12);
    const aqiBase = e.hum > 70 ? 45 : 85;
    const aqiSeed = hashCode(loc.name) % 35;
    return {
      place: { name: loc.name, admin: loc.admin, lat: loc.lat, lon: loc.lon },
      offline: true,
      current: {
        tempC: temp, feelsC: temp + (hum>70?1.5:-0.5), humidity: Math.round(hum),
        windKph: wind, windDir: e.dir, pressureMb: press,
        conditionText: e.cond, isDay: 1
      },
      today: { maxC: temp+3, minC: temp-4, rainChance: Math.round(p0) },
      tomorrow: { maxC: temp+2.5, minC: temp-3.5, rainChance: Math.round(p1) },
      aqi: { usEpaIndex: aqiBase < 60 ? 3 : 2, pm25: Math.round((aqiBase+aqiSeed) * 0.42 * 10)/10 },
      alerts: []
    };
  }

  function parseWeatherApi(json){
    const loc = json.location || {};
    const cur = json.current || {};
    const days = (json.forecast && json.forecast.forecastday) || [];
    const today = days[0] && days[0].day;
    const tomorrow = days[1] && days[1].day;
    const aq = cur.air_quality;
    const alerts = (json.alerts && json.alerts.alert) || [];
    return {
      place: { name: loc.name, admin: loc.region, lat: loc.lat, lon: loc.lon },
      offline: false,
      current: {
        tempC: cur.temp_c, feelsC: cur.feelslike_c, humidity: cur.humidity,
        windKph: cur.wind_kph, windDir: cur.wind_dir, pressureMb: cur.pressure_mb,
        conditionText: cur.condition ? cur.condition.text : 'Unknown', isDay: cur.is_day
      },
      today: today ? { maxC: today.maxtemp_c, minC: today.mintemp_c, rainChance: today.daily_chance_of_rain } : null,
      tomorrow: tomorrow ? { maxC: tomorrow.maxtemp_c, minC: tomorrow.mintemp_c, rainChance: tomorrow.daily_chance_of_rain } : null,
      aqi: aq ? { usEpaIndex: aq['us-epa-index'], pm25: aq.pm2_5 } : null,
      alerts: alerts.map(a => ({
        event: a.event || a.headline || 'Weather alert',
        headline: a.headline, areas: a.areas, severity: a.severity,
        effective: a.effective, expires: a.expires, desc: a.desc
      }))
    };
  }

  function setLiveStatus(isLive, reason){
    liveMode = isLive;
    const dot = document.querySelector('.panel-head .status .dot');
    const label = document.querySelector('.panel-head .status span:last-child');
    if(dot && label){
      if(isLive){
        dot.style.background = 'var(--rain)';
        label.textContent = STRINGS[lang].statusLive;
      } else {
        dot.style.background = 'var(--amber)';
        label.textContent = STRINGS[lang].statusOffline;
      }
    }
    const banner = document.getElementById('statusBanner');
    if(banner){
      if(isLive){
        banner.style.display = 'none';
      } else {
        banner.style.display = 'flex';
        document.getElementById('statusBannerText').textContent =
          (lang==='hi' ? 'लाइव डेटा उपलब्ध नहीं: ' : 'Live data unavailable: ') + (reason || 'unknown error') +
          (lang==='hi' ? ' — डेमो डेटा दिखाया जा रहा है।' : ' — showing offline demo data instead.');
      }
    }
  }

  async function geocode(name){
    const key = name.toLowerCase();
    if(cache[key]) return cache[key];
    try{
      const res = await withTimeout(fetch('/api/geocode?name=' + encodeURIComponent(name)), 7000);
      const data = await res.json();
      if(data && data.error) throw new Error(data.message || 'geocode error');
      if(!Array.isArray(data) || !data.length) throw new Error('city not found');
      const r = data[0];
      const loc = { name: r.name, admin: r.region, lat: r.lat, lon: r.lon, offline:false };
      cache[key] = loc;
      return loc;
    }catch(err){
      console.warn('Live geocoding unavailable, using offline dataset:', err.message);
      const loc = fallbackLoc(name);
      cache[key] = loc;
      return loc;
    }
  }

  async function fetchAll(loc){
    if(loc.offline){
      setLiveStatus(false, 'no live coordinates for this city');
      return buildOfflineNormalized(loc);
    }
    try{
      const q = `${loc.lat},${loc.lon}`;
      const res = await withTimeout(fetch('/api/weather?location=' + encodeURIComponent(q) + '&lang=' + lang), 7000);
      const json = await res.json();
      if(json && json.error) throw new Error(json.message || 'weather API error');
      if(!json.current) throw new Error('malformed weather response');
      setLiveStatus(true);
      return parseWeatherApi(json);
    }catch(err){
      console.warn('Live weather unavailable, using offline dataset:', err.message);
      setLiveStatus(false, err.message);
      return buildOfflineNormalized(loc);
    }
  }

  /* ---------------- instrument panel ---------------- */
  function updateInstrumentPanel(norm){
    const c = norm.current;
    document.getElementById('sideCity').textContent = norm.place.name + (norm.place.admin ? ', ' + norm.place.admin : '');
    document.getElementById('sideCoord').textContent = `${norm.place.lat.toFixed(2)}°N ${norm.place.lon.toFixed(2)}°E`;
    document.getElementById('dTemp').innerHTML = c.tempC.toFixed(1) + '<small> °C</small>';
    document.getElementById('dFeels').innerHTML = c.feelsC.toFixed(1) + '<small> °C</small>';
    document.getElementById('dHum').innerHTML = c.humidity + '<small> %</small>';
    document.getElementById('dWind').innerHTML = c.windKph.toFixed(0) + '<small> km/h ' + c.windDir + '</small>';
    document.getElementById('dPress').innerHTML = c.pressureMb.toFixed(0) + '<small> hPa</small>';

    document.getElementById('condDesc').textContent = c.conditionText;
    document.getElementById('condSub').textContent = (norm.offline ? 'Offline demo · ' : 'WeatherAPI.com · ') + new Date().toLocaleTimeString();
    document.getElementById('condIcon').innerHTML = iconSVG(c.conditionText);

    document.getElementById('tkCity').textContent = norm.place.name.toUpperCase();
    document.getElementById('tkTemp').textContent = c.tempC.toFixed(1) + ' °C';
    document.getElementById('tkPress').textContent = c.pressureMb.toFixed(0) + ' hPa';
    document.getElementById('tkWind').textContent = c.windKph.toFixed(0) + ' km/h ' + c.windDir;
    document.getElementById('tkHum').textContent = c.humidity + '%';
    const now = new Date();
    document.getElementById('tkTime').textContent = now.toLocaleTimeString();
    document.getElementById('footTime').textContent = (norm.offline ? 'Offline demo data · ' : 'Last sync ') + now.toLocaleString();
  }

  /* ---------------- chat log ---------------- */
  const chatLog = document.getElementById('chatLog');

  function addMsg(role, html, meta){
    const wrap = document.createElement('div');
    wrap.className = 'msg ' + role;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = html;
    wrap.appendChild(bubble);
    if(meta){
      const m = document.createElement('div');
      m.className = 'msg-meta';
      m.textContent = meta;
      wrap.appendChild(m);
    }
    chatLog.appendChild(wrap);
    chatLog.scrollTop = chatLog.scrollHeight;
    return bubble;
  }

  function addTyping(){
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    wrap.id = 'typingIndicator';
    wrap.innerHTML = '<div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
    chatLog.appendChild(wrap);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  function removeTyping(){
    const t = document.getElementById('typingIndicator');
    if(t) t.remove();
  }

  /* ---------------- query understanding (lightweight, client-side) ---------------- */
  const KNOWN_CITIES = ['delhi','mumbai','chennai','kolkata','bengaluru','bangalore','hyderabad','pune','ahmedabad','jaipur','lucknow','kochi','cochin','shimla','patna','bhopal','guwahati','chandigarh','srinagar','goa','panaji','varanasi','indore','nagpur','surat','visakhapatnam','vizag','coimbatore','thiruvananthapuram','bhubaneswar','ranchi','raipur','dehradun','amritsar','agra','mysuru','mysore','puri','darjeeling','odisha'];

  function extractCity(text){
    const lower = text.toLowerCase();
    for(const c of KNOWN_CITIES){
      if(lower.includes(c)) return c.charAt(0).toUpperCase()+c.slice(1);
    }
    const m = lower.match(/\bin\s+([a-zA-Z\u0900-\u097F]+)/) || lower.match(/\bfor\s+([a-zA-Z\u0900-\u097F]+)/);
    if(m) return m[1].charAt(0).toUpperCase()+m[1].slice(1);
    const words = text.split(/\s+/).filter(w => /^[A-Z][a-zA-Z]+$/.test(w) && !['I','What','Is','Will','Should','How','Any'].includes(w));
    if(words.length) return words[words.length-1];
    return null;
  }

  function classifyIntent(text){
    const t = text.toLowerCase();
    if(/(alert|warning|advisory|cyclone|storm surge|tsunami|lightning|thunder|damini)/.test(t)) return 'alerts';
    if(/(aqi|air quality|pollution|pm2\.5|pm 2\.5)/.test(t)) return 'aqi';
    if(/(rain|barsat|baarish|precip|shower)/.test(t)) return 'rain';
    if(/(wind|hawa|gust)/.test(t)) return 'wind';
    if(/(humid|nami)/.test(t)) return 'humidity';
    if(/(fish|boat|sea|wave)/.test(t)) return 'marine';
    if(/(temp|hot|cold|degree|garmi|thand)/.test(t)) return 'temp';
    return 'general';
  }

  function aqiBand(index){
    return ['—','Good','Moderate','Unhealthy for sensitive groups','Unhealthy','Very unhealthy','Hazardous'][index] || 'Unknown';
  }

  async function answerQuery(text){
    const cityName = extractCity(text) || 'Delhi';
    const intent = classifyIntent(text);

    const loc = await geocode(cityName);
    const norm = await fetchAll(loc);
    updateInstrumentPanel(norm);

    const c = norm.current;
    const place = norm.place.name + (norm.place.admin ? ', ' + norm.place.admin : '');
    const desc = (c.conditionText || 'unsettled conditions').toLowerCase();
    const sourceLabel = norm.offline
      ? 'Offline demo dataset · live feed unreachable'
      : 'WeatherAPI.com (current + forecast + alerts + AQI)';

    let html = '';
    if(intent === 'alerts'){
      if(norm.alerts && norm.alerts.length){
        html = `<b>${norm.alerts.length} active alert${norm.alerts.length>1?'s':''}</b> for <b>${place}</b>:<br><br>` +
          norm.alerts.slice(0,3).map(a =>
            `• <b>${a.event}</b>${a.areas ? ' — ' + a.areas : ''}${a.effective ? ' (from ' + new Date(a.effective).toLocaleString() + ')' : ''}`
          ).join('<br>');
      } else {
        html = norm.offline
          ? `I can't check live alerts for <b>${place}</b> right now (offline demo mode) — current conditions shown are approximate: ${desc}, ${c.tempC.toFixed(1)}°C.`
          : `No active weather alerts for <b>${place}</b> right now, per WeatherAPI's aggregated national alert feed. Current conditions: ${desc}, ${c.tempC.toFixed(1)}°C.`;
      }
    } else if(intent === 'rain'){
      const p0 = norm.today ? norm.today.rainChance : 0;
      const p1 = norm.tomorrow ? norm.tomorrow.rainChance : p0;
      html = `In <b>${place}</b> right now it's <b>${desc}</b> at ${c.tempC.toFixed(1)}°C. Rain chance today is <b>${p0}%</b>, ${norm.tomorrow ? `rising to <b>${p1}%</b> tomorrow` : ''}. `
        + (p1 >= 60 ? `I'd keep an umbrella close.` : `Fairly low risk — should be a dry stretch.`);
    } else if(intent === 'wind'){
      html = `Wind in <b>${place}</b> is currently <b>${c.windKph.toFixed(0)} km/h</b> from the ${c.windDir}. Conditions are ${desc}.`;
    } else if(intent === 'humidity'){
      html = `Relative humidity in <b>${place}</b> is <b>${c.humidity}%</b>, with a surface pressure of ${c.pressureMb.toFixed(0)} hPa — ${desc}.`;
    } else if(intent === 'temp'){
      const rangeTxt = norm.today ? `Today's range is ${norm.today.minC.toFixed(0)}–${norm.today.maxC.toFixed(0)}°C, and it's ${desc}.` : `and it's ${desc}.`;
      html = `<b>${place}</b> is at <b>${c.tempC.toFixed(1)}°C</b> right now (feels like ${c.feelsC.toFixed(1)}°C). ${rangeTxt}`;
    } else if(intent === 'marine'){
      html = `I only have general surface wind for <b>${place}</b> in this demo — currently ${c.windKph.toFixed(0)} km/h from the ${c.windDir}. A production build would pull IMD's marine wind/wave advisory here and give you a direct go/no-go for small craft. `
        + (norm.alerts && norm.alerts.length ? `Note: there ${norm.alerts.length>1?'are':'is'} ${norm.alerts.length} active alert${norm.alerts.length>1?'s':''} for this area — worth checking before heading out.` : '');
    } else if(intent === 'aqi'){
      if(norm.aqi){
        const band = aqiBand(norm.aqi.usEpaIndex);
        html = `Air quality in <b>${place}</b> is <b>${band}</b> (US EPA index ${norm.aqi.usEpaIndex}/6), with PM2.5 around ${norm.aqi.pm25?.toFixed(1) ?? '—'} µg/m³. ${norm.aqi.usEpaIndex>=3 ? 'Consider a mask outdoors if you\'re sensitive to pollution.' : 'Should be fine for most outdoor activity.'}`;
      } else {
        html = `I couldn't pull an AQI reading for <b>${place}</b> right now.`;
      }
    } else {
      const rainTxt = norm.today ? ` Rain chance today is ${norm.today.rainChance}%.` : '';
      html = `<b>${place}</b> right now: ${desc}, <b>${c.tempC.toFixed(1)}°C</b> (feels ${c.feelsC.toFixed(1)}°C), humidity ${c.humidity}%, wind ${c.windKph.toFixed(0)} km/h ${c.windDir}.${rainTxt}`;
    }

    return { html, src: sourceLabel };
  }

  /* ---------------- interaction ---------------- */
  async function handleAsk(){
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if(!text) return;
    addMsg('user', escapeHtml(text));
    input.value = '';
    document.getElementById('sendBtn').disabled = true;
    addTyping();
    try{
      const {html, src} = await answerQuery(text);
      await new Promise(r=>setTimeout(r, 350));
      removeTyping();
      addMsg('bot', html + (src ? `<div class="src">${src}</div>` : ''));
    }catch(err){
      removeTyping();
      addMsg('bot', `Something went wrong reaching the weather service. Please try again in a moment.`);
      console.error(err);
    }
    document.getElementById('sendBtn').disabled = false;
    input.focus();
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  document.getElementById('composer').addEventListener('submit', (e)=>{
    e.preventDefault();
    handleAsk();
  });

  /* ---------------- init ---------------- */
  async function init(){
    applyI18n();
    addMsg('bot', STRINGS[lang].greet);
    try{
      const loc = await geocode('Delhi');
      const norm = await fetchAll(loc);
      updateInstrumentPanel(norm);
      if(norm.offline){
        addMsg('bot', lang==='hi'
          ? 'ध्यान दें: लाइव मौसम फ़ीड तक नहीं पहुंचा जा सका (सर्वर पर WEATHERAPI_KEY सेट नहीं है या नेटवर्क अनुपलब्ध है), इसलिए मैं फ़िलहाल ऑफ़लाइन डेमो डेटा दिखा रहा हूं। सवाल पूछना अभी भी पूरी तरह से काम करता है।'
          : "Heads up: I couldn't reach the live weather feed (check that WEATHERAPI_KEY is set on the server, and that server.js is actually running), so I'm on offline demo data for now. Asking questions still works fully.");
      }
    }catch(e){
      console.error('init failed unexpectedly:', e);
    }
  }
  init();

})();
