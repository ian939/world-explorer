(function () {
  "use strict";

  const STORAGE_KEY = "world-explorer-progress-v2";
  const SOUND_KEY = "world-explorer-sound";
  const countries = Array.isArray(window.WORLD_EXPLORER_COUNTRIES) ? window.WORLD_EXPLORER_COUNTRIES : [];

  const regionColors = { 아시아: "#efae42", 유럽: "#7183dc", 아프리카: "#63a95d", 아메리카: "#d96a69", 오세아니아: "#34a6a4", 남극: "#d4e8ea" };
  const state = { discovered: loadProgress(), activeCountry: null, pointed: null, focusContinent: null, missionIndex: 0, soundOn: loadSound(), view: "explore", globe: null, geojson: null, resizeObserver: null, returnFocus: null };
  const els = {
    globeWrap: document.getElementById("globeWrap"), globeCanvas: document.getElementById("globeCanvas"), globeLoading: document.getElementById("globeLoading"), globeError: document.getElementById("globeError"),
    progressText: document.getElementById("progressText"), progressTrack: document.getElementById("progressTrack"), progressBar: document.getElementById("progressBar"), goalText: document.getElementById("goalText"), guideTitle: document.getElementById("guideTitle"), guideMessage: document.getElementById("guideMessage"),
    collectionCount: document.getElementById("collectionCount"), collectionGrid: document.getElementById("collectionGrid"), dialog: document.getElementById("countryDialog"), dialogContent: document.getElementById("dialogContent"),
    guardianDialog: document.getElementById("guardianDialog"), guardianAnswer: document.getElementById("guardianAnswer"), guardianError: document.getElementById("guardianError"), soundButton: document.getElementById("soundButton"), toast: document.getElementById("toast"), confetti: document.getElementById("confetti")
  };

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? new Set(saved.filter(id => countries.some(country => country.id === id))) : new Set();
    } catch (_) { return new Set(); }
  }

  // 소리는 처음부터 켜 두고, 아이(보호자)가 끄면 그 선택을 기억한다
  function loadSound() {
    try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch (_) { return true; }
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.discovered])); } catch (_) { /* 저장을 쓸 수 없는 환경 */ }
  }

  function featureIso(feature) {
    const props = feature && feature.properties ? feature.properties : {};
    return [props.ISO_A3, props.ADM0_A3, props.GU_A3, props.SOV_A3].find(value => value && value !== "-99") || "";
  }

  function targetForFeature(feature) { return countries.find(country => country.iso === featureIso(feature)); }

  function flagAsset(country) { return `./assets/flags/${country.id}.svg`; }

  // 퀴즈를 다 맞히면 받는 그림: 두 형제가 그 나라 랜드마크 앞에서 찍은 크레파스 그림
  const landmarks = window.WORLD_EXPLORER_LANDMARKS || {};
  const capitals = window.WORLD_EXPLORER_CAPITALS || {};
  const areas = window.WORLD_EXPLORER_AREA || {};
  const HOME_ID = "kr"; // 크기·거리를 견주는 기준: 우리나라
  function landmarkName(country) { return landmarks[country.id] ? landmarks[country.id].name : country.place.split(" · ")[0]; }
  // 큰 그림은 성공 화면에만, 도감 카드·지구본 배지는 작은 그림(thumb)
  function artAsset(country, size = "thumb") { return size === "full" ? `./assets/landmarks/${country.id}.webp` : `./assets/landmarks/thumb/${country.id}.webp`; }
  // 그림 파일이 없으면 대표 아이콘으로 대신 보여 준다
  function artImg(country, size = "thumb") {
    return `<img src="${artAsset(country, size)}" width="480" height="640" alt="" loading="lazy" onerror="this.parentElement.classList.add('no-art');this.remove()" />`;
  }
  // 받침이 있으면 true (ㄹ 받침은 따로 알려 준다: "으로/로" 고를 때)
  function batchim(word) {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    return code >= 0 && code < 11172 ? code % 28 : 0;
  }
  // 받침 있는 이름 뒤에는 "이에요", 없으면 "예요"
  function ieyo(word) {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    return code >= 0 && code < 11172 && code % 28 ? "이에요" : "예요";
  }

  const continentOrder = ["아시아", "유럽", "아프리카", "아메리카", "오세아니아"];
  const SPEECH = window.WORLD_EXPLORER_SPEECH;
  const recordedVoice = new Set((window.WORLD_EXPLORER_VOICE || "").split(" ").filter(Boolean));
  const voicePlayer = new Audio(); // 하나를 계속 써야 iPad가 두 번째 소리부터 막지 않는다
  voicePlayer.preload = "auto";
  // 긴 나라 이름은 줄을 바꾸지 않고 글자를 줄여 한 줄에 넣는다
  function nameClass(country) { return country.name.length >= 7 ? "name-long" : country.name.length >= 5 ? "name-mid" : ""; }
  function continentOf(country) { return country.region.startsWith("유럽") ? "유럽" : country.region; }
  function countriesByContinent() {
    return continentOrder
      .map(name => ({ name, color: regionColors[name], list: countries.filter(country => continentOf(country) === name) }))
      .filter(group => group.list.length);
  }

  function countryTooltip(country) {
    const found = state.discovered.has(country.id);
    return `<div class="globe-country-label"><img src="${flagAsset(country)}" width="64" height="48" alt=""><span><b>${country.name}</b><small>${found ? "도감 열림 · 눌러서 다시 보기" : "아직 회색 나라 · 눌러서 탐험"}</small></span></div>`;
  }

  // 국기 목록에서 고른 나라: 지구본 위에서 노랗게 빛나며 아이가 직접 눌러 주기를 기다린다
  const POINTED_COLOR = "#ffd23f";
  function isPointed(target) { return Boolean(target) && state.pointed === target.id; }
  // 대륙 버튼으로 고른 대륙: 땅이 살짝 솟고 노란 테두리
  const CONTINENT_NAMES = { Asia: "아시아", Europe: "유럽", Africa: "아프리카", "North America": "아메리카", "South America": "아메리카", Oceania: "오세아니아", Antarctica: "남극" };
  const CONTINENT_VIEWS = {
    // label: 대륙 이름표는 땅을 가리지 않게 옆 바다 위에
    아시아: { lat: 32, lng: 95, altitude: 1.9, label: [8, 72] },
    유럽: { lat: 52, lng: 18, altitude: 1.62, label: [45, -14] },
    아프리카: { lat: 2, lng: 20, altitude: 1.75, label: [-8, -2] },
    아메리카: { lat: 12, lng: -82, altitude: 2.3, label: [6, -122] },
    오세아니아: { lat: -20, lng: 150, altitude: 1.62, label: [2, 162] }
  };
  function featureContinent(feature) {
    const target = targetForFeature(feature);
    if (target) return continentOf(target);
    return CONTINENT_NAMES[feature.properties && feature.properties.CONTINENT] || "";
  }
  function inFocusContinent(feature) { return Boolean(state.focusContinent) && featureContinent(feature) === state.focusContinent; }
  function polygonStroke(feature) {
    const target = targetForFeature(feature);
    if (isPointed(target)) return "#ffffff";
    if (inFocusContinent(feature)) return "#ffd23f";
    return target && !state.discovered.has(target.id) ? "rgba(225,231,226,.92)" : "rgba(255,248,210,.78)";
  }
  function polygonAlt(feature) {
    const target = targetForFeature(feature);
    if (isPointed(target)) return 0.06;
    const base = target ? (state.discovered.has(target.id) ? 0.026 : 0.014) : 0.007;
    return inFocusContinent(feature) ? base + 0.045 : base;
  }
  function pointerElement(country) {
    const element = document.createElement("div");
    element.className = "globe-pointer";
    element.setAttribute("aria-hidden", "true");
    element.innerHTML = `<span class="globe-pointer-inner"><b>${country.name}</b><i>👇</i></span>`;
    return element;
  }

  // 도감이 열린 나라는 지구본의 그 나라 자리에 국기 이름표를 붙인다
  function globeMarkers() {
    const markers = countries.filter(country => state.discovered.has(country.id) && country.id !== state.pointed).map(country => ({ country, kind: "flag" }));
    const pointed = countries.find(country => country.id === state.pointed);
    if (pointed) markers.push({ country: pointed, kind: "pointer" });
    const view = CONTINENT_VIEWS[state.focusContinent];
    if (view) markers.push({ country: { lat: view.label[0], lon: view.label[1] }, kind: "continent", name: state.focusContinent });
    return markers;
  }
  function continentLabelElement(name) {
    const element = document.createElement("div");
    element.className = "globe-continent";
    element.setAttribute("aria-hidden", "true");
    element.style.setProperty("--continent", regionColors[name]);
    const total = countries.filter(country => continentOf(country) === name).length;
    element.innerHTML = `<span class="globe-continent-inner"><b>${name}</b><small>탐험할 나라 ${total}개</small></span>`;
    return element;
  }
  // 도감이 열린 나라: 지도 위에 네모 국기 + 한글 이름표 (누르면 그 나라 다시 보기)
  function flagLabelElement(country) {
    const label = document.createElement("button");
    label.type = "button";
    label.tabIndex = -1;
    label.className = "globe-flag";
    label.dataset.lat = country.lat;
    label.dataset.lon = country.lon;
    label.setAttribute("aria-label", `${country.name} 다시 보기`);
    label.innerHTML = `<img src="${flagAsset(country)}" width="28" height="21" alt="" /><b>${country.name}</b>`;
    label.addEventListener("click", event => { event.stopPropagation(); openCountry(country.id, { skipFly: true }); });
    return label;
  }
  // 지구본 가장자리에 비스듬히 몰린 이름표는 겹쳐 보이므로, 화면 가운데에서 70° 넘게 떨어진 나라는 숨긴다
  let edgeFrame = 0;
  function updateFlagEdges() {
    edgeFrame = 0;
    if (!state.globe) return;
    const view = state.globe.pointOfView();
    const rad = Math.PI / 180;
    const cosLimit = Math.cos(70 * rad);
    els.globeCanvas.querySelectorAll(".globe-flag").forEach(label => {
      const lat = Number(label.dataset.lat) * rad, lon = Number(label.dataset.lon) * rad;
      const cos = Math.sin(view.lat * rad) * Math.sin(lat) + Math.cos(view.lat * rad) * Math.cos(lat) * Math.cos(lon - view.lng * rad);
      label.classList.toggle("is-edge", cos < cosLimit);
    });
  }
  function scheduleFlagEdges() { if (!edgeFrame) edgeFrame = window.requestAnimationFrame(updateFlagEdges); }

  function markerElement(marker) {
    if (marker.kind === "continent") return continentLabelElement(marker.name);
    return marker.kind === "pointer" ? pointerElement(marker.country) : flagLabelElement(marker.country);
  }

  function polygonColor(feature) {
    const target = targetForFeature(feature);
    if (isPointed(target)) return POINTED_COLOR;
    if (target) return state.discovered.has(target.id) ? target.accent : "#9da6a2";
    const continent = feature.properties && feature.properties.CONTINENT;
    const names = { Asia: "아시아", Europe: "유럽", Africa: "아프리카", "North America": "아메리카", "South America": "아메리카", Oceania: "오세아니아", Antarctica: "남극" };
    return regionColors[names[continent]] || "#a9b981";
  }

  function sizeGlobe() {
    if (!state.globe) return;
    const rect = els.globeWrap.getBoundingClientRect();
    const size = Math.max(280, Math.floor(Math.min(rect.width, rect.height || rect.width)));
    state.globe.width(size).height(size);
  }

  let geojsonPromise = null;
  function loadGeojson() {
    if (state.geojson) return Promise.resolve(state.geojson);
    if (!geojsonPromise) {
      geojsonPromise = fetch("./data/countries.geojson")
        .then(response => { if (!response.ok) throw new Error("지도 데이터를 불러오지 못했습니다."); return response.json(); })
        .then(data => { state.geojson = data; return data; })
        .catch(error => { geojsonPromise = null; throw error; });
    }
    return geojsonPromise;
  }

  // 평면 세계지도: 아이들이 늘 보는 지도(구글 지도)와 같은 메르카토르 방식, 북위 76° ~ 남위 57° (남극은 뺌)
  const MAP_W = 1000, MAP_TOP = 76, MAP_BOTTOM = -57;
  const mercator = lat => Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, lat)) * Math.PI / 360));
  const MAP_H = Math.round((mercator(MAP_TOP) - mercator(MAP_BOTTOM)) / (2 * Math.PI) * MAP_W);
  const mapX = lon => ((lon + 180) / 360 * MAP_W).toFixed(1);
  const mapY = lat => ((mercator(MAP_TOP) - mercator(lat)) / (2 * Math.PI) * MAP_W).toFixed(1);
  let worldMap = null;
  function ringPath(ring) {
    let d = "", last = "";
    ring.forEach(([lon, lat], index) => {
      const point = `${mapX(lon)} ${mapY(lat)}`;
      if (point === last) return;
      d += (index ? "L" : "M") + point;
      last = point;
    });
    return d + "Z";
  }
  function featurePath(feature) {
    const geometry = feature.geometry;
    if (!geometry) return "";
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
    return polygons.map(polygon => polygon.map(ringPath).join("")).join("");
  }
  // 땅 조각(본토·섬)마다 지도 위 네모 범위
  function polygonBoxes(feature) {
    const geometry = feature.geometry;
    if (!geometry) return [];
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
    return polygons.map(polygon => {
      const xs = polygon[0].map(([lon]) => Number(mapX(lon))), ys = polygon[0].map(([, lat]) => Number(mapY(lat)));
      return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    });
  }
  function featureRings(feature) {
    const geometry = feature.geometry;
    if (!geometry) return [];
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
    return polygons.map(polygon => polygon[0]);
  }
  function buildWorldMap(geojson) {
    if (worldMap) return worldMap;
    const byIso = new Map(), boxes = new Map(), shapes = new Map();
    let base = "";
    geojson.features.forEach(feature => {
      if (feature.properties && feature.properties.CONTINENT === "Antarctica") return;
      const d = featurePath(feature);
      base += d;
      const iso = featureIso(feature);
      if (countries.some(country => country.iso === iso)) {
        byIso.set(iso, (byIso.get(iso) || "") + d);
        boxes.set(iso, (boxes.get(iso) || []).concat(polygonBoxes(feature)));
        shapes.set(iso, (shapes.get(iso) || []).concat(featureRings(feature)));
      }
    });
    worldMap = { base, byIso, boxes, shapes };
    return worldMap;
  }
  // 이름표를 붙일 범위: 나라 한가운데가 들어 있는 본토 + 그 가까이 있는 섬 (멀리 떨어진 해외 땅은 뺀다)
  function countryArea(country) {
    const px = Number(mapX(country.lon)), py = Number(mapY(country.lat));
    const boxes = worldMap.boxes.get(country.iso) || [];
    if (!boxes.length) return { x0: px - 8, x1: px + 8, y0: py - 8, y1: py + 8 };
    const center = box => [(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2];
    const gap = box => Math.max(box.x0 - px, px - box.x1, 0) + Math.max(box.y0 - py, py - box.y1, 0);
    const main = boxes.reduce((best, box) => gap(box) < gap(best) ? box : best);
    const [mx, my] = center(main);
    const reach = Math.max(main.x1 - main.x0, main.y1 - main.y0) * 0.6 + 70;
    const near = boxes.filter(box => { const [x, y] = center(box); return Math.hypot(x - mx, y - my) <= reach; });
    return near.reduce((all, box) => ({ x0: Math.min(all.x0, box.x0), x1: Math.max(all.x1, box.x1), y0: Math.min(all.y0, box.y0), y1: Math.max(all.y1, box.y1) }), main);
  }
  // 이번 나라만 색을 칠하고 굵은 테두리 + 국기 이름표 (다른 나라는 모두 회색)
  function whereMapSvg(country) {
    const map = worldMap;
    const area = countryArea(country);
    const ex = (area.x0 + area.x1) / 2, ey = (area.y0 + area.y1) / 2;
    // 이름표를 붙일 때 나라 모양과 띄울 거리
    const rx = Math.max(16, (area.x1 - area.x0) / 2 + 8), ry = Math.max(16, (area.y1 - area.y0) / 2 + 8);
    // 폰처럼 좁은 화면은 나라 주변을 확대 (나라와 이름표가 다 들어오게)
    const home = country.id !== HOME_ID ? capitals[HOME_ID] : null;
    const homeX = home ? Number(mapX(home.lon)) : 0, homeY = home ? Number(mapY(home.lat)) : 0;
    let vx = 0, vy = 0, vw = MAP_W, vh = MAP_H;
    if (window.innerWidth < 640) {
      // 우리나라가 가까우면 같이 보이게 범위를 넓힌다
      const box = { ...area };
      if (home && Math.abs(homeX - ex) < MAP_W * 0.35) {
        box.x0 = Math.min(box.x0, homeX); box.x1 = Math.max(box.x1, homeX);
        box.y0 = Math.min(box.y0, homeY); box.y1 = Math.max(box.y1, homeY);
      }
      const cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
      vw = Math.min(MAP_W, Math.max(MAP_W / 2, box.x1 - box.x0 + 136, (box.y1 - box.y0 + 176) * MAP_W / MAP_H));
      vh = vw * MAP_H / MAP_W;
      vx = Math.min(MAP_W - vw, Math.max(0, cx - vw / 2));
      vy = Math.min(MAP_H - vh, Math.max(0, cy - vh / 2));
    }
    // 이름표: 나라 위, 자리가 없으면 아래
    // 이름표·선 굵기는 화면에서 비슷한 크기로 보이게 (폰은 지도가 작게 보이므로 더 키운다)
    const scale = vw / MAP_W * (window.innerWidth < 640 ? 2.2 : 1);
    const tagH = 46 * scale, flagW = 40 * scale, flagH = 30 * scale, font = 26 * scale, pad = 10 * scale;
    const tagW = pad * 3 + flagW + country.name.length * font * 0.95;
    let tagY = ey - ry - 10 * scale - tagH;
    if (tagY < vy + 4 * scale) tagY = ey + ry + 10 * scale;
    const tagX = Math.min(vx + vw - tagW - 6 * scale, Math.max(vx + 6 * scale, ex - tagW / 2));
    const n = value => value.toFixed(1);

    // 수도: 빨간 핀 + "수도 ○○" 이름표 (핀 오른쪽, 자리가 없으면 왼쪽)
    const capital = capitals[country.id];
    let capitalSvg = "", capBox = null;
    if (capital) {
      const px = Number(mapX(capital.lon)), py = Number(mapY(capital.lat));
      const pin = 1.1 * scale;
      const capFont = 19 * scale, capH = 32 * scale, capPad = 9 * scale;
      const capText = `수도 ${capital.name}`;
      const capW = capPad * 2 + capText.replace(/ /g, "").length * capFont * 0.95 + capFont * 0.3;
      let capX = px + 12 * scale;
      if (capX + capW > vx + vw - 4 * scale) capX = px - 12 * scale - capW;
      const capY = py - 22 * pin - capH / 2;
      // 나라 이름표와 겹치면 나라 이름표를 수도 이름표 위(자리가 없으면 아래)로 비킨다
      const overlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
      const pinTop = py - 34 * pin;
      capBox = [Math.min(capX, px - 12 * pin), Math.min(capY, pinTop), capW + 24 * pin, capH + 34 * pin];
      if (overlap(tagX, tagY, tagW, tagH, ...capBox)) {
        tagY = Math.min(capY, pinTop) - 8 * scale - tagH;
        if (tagY < vy + 4 * scale) tagY = Math.max(capY + capH, py) + 10 * scale;
      }
      capitalSvg = `
      <g class="map-capital" data-fit="${capX < px ? "left" : "right"}" data-pad="${n(capPad)}" data-lead="0">
        <g transform="translate(${n(px)} ${n(py)}) scale(${pin.toFixed(3)})"><g class="map-pin">
          <path d="M0 0C-4-9-11-14-11-22A11 11 0 1 1 11-22C11-14 4-9 0 0Z" />
          <circle cy="-22" r="4.5" />
        </g></g>
        <g><rect x="${n(capX)}" y="${n(capY)}" width="${n(capW)}" height="${n(capH)}" rx="${n(capH / 2)}" />
        <text x="${n(capX + capPad)}" y="${n(capY + capH / 2)}" dominant-baseline="central" style="font-size:${n(capFont)}px"><tspan class="map-capital-label">수도</tspan> ${capital.name}</text></g>
      </g>`;
    }
    // 우리나라: 따로 색칠 + "우리나라" 이름표, 서울에서 그 나라 수도까지 비행기가 날아가는 점선
    let homeSvg = "", routeSvg = "";
    if (home) {
      const homeIso = (countries.find(item => item.id === HOME_ID) || {}).iso;
      const hFont = 16 * scale, hH = 28 * scale, hPad = 8 * scale;
      const hW = hPad * 2 + 5 * hFont;
      let hX = homeX - hW / 2, hY = homeY + 22 * scale;
      const overlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
      const blocked = (x, y) => overlap(x, y, hW, hH, tagX, tagY, tagW, tagH) || (capBox && overlap(x, y, hW, hH, ...capBox));
      if (blocked(hX, hY)) { hX = homeX - hW - 14 * scale; hY = homeY - hH / 2; }
      if (blocked(hX, hY)) { hX = homeX - hW / 2; hY = homeY - 30 * scale - hH; }
      homeSvg = `<g class="map-home-tag" data-fit="center" data-pad="${n(hPad)}" data-lead="0">
        <rect x="${n(hX)}" y="${n(hY)}" width="${n(hW)}" height="${n(hH)}" rx="${n(hH / 2)}" />
        <text x="${n(hX + hPad)}" y="${n(hY + hH / 2)}" dominant-baseline="central" style="font-size:${n(hFont)}px">🏠 우리나라</text>
      </g>`;
      if (capital) {
        const sx = homeX, sy = homeY;
        let tx = Number(mapX(capital.lon));
        const ty = Number(mapY(capital.lat));
        // 지도 끝을 넘어가는 쪽이 더 가까우면 (예: 미국) 오른쪽 끝으로 나가 왼쪽 끝에서 들어온다
        let wrap = 0;
        if (tx - sx > MAP_W / 2) { tx -= MAP_W; wrap = MAP_W; } else if (sx - tx > MAP_W / 2) { tx += MAP_W; wrap = -MAP_W; }
        const dx = tx - sx, dy = ty - sy, len = Math.max(1, Math.hypot(dx, dy));
        const bend = Math.min(150, len * 0.28);
        let cx = (sx + tx) / 2 - dy / len * bend, cy = (sy + ty) / 2 + dx / len * bend;
        if (cy > (sy + ty) / 2) { cx = (sx + tx) / 2 + dy / len * bend; cy = (sy + ty) / 2 - dx / len * bend; } // 위로 휘게
        const d = `M${n(sx)} ${n(sy)}Q${n(cx)} ${n(cy)} ${n(tx)} ${n(ty)}`;
        const route = `<path class="map-route" d="${d}" style="stroke-width:${n(3 * scale)};stroke-dasharray:${n(9 * scale)} ${n(7 * scale)}" />
          <g class="map-plane"><path d="M15 0L-5-4-9-13-13-13-10-4-15-3-15 3-10 4-13 13-9 13-5 4Z" transform="scale(${(scale * 0.65).toFixed(2)})" />
            <animateMotion dur="3.2s" repeatCount="indefinite" rotate="auto" path="${d}" /></g>`;
        routeSvg = `<g class="map-route-group">${route}</g>` + (wrap ? `<g class="map-route-group" transform="translate(${wrap} 0)">${route}</g>` : "");
      }
    }
    return `<svg viewBox="${n(vx)} ${n(vy)} ${n(vw)} ${n(vh)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <rect class="map-sea" width="${MAP_W}" height="${MAP_H}" />
      <path class="map-land" d="${map.base}" />
      ${home ? `<path class="map-home" d="${map.byIso.get((countries.find(item => item.id === HOME_ID) || {}).iso) || ""}" style="stroke-width:${n(1.5 * scale)}" />` : ""}
      <path class="map-here" d="${map.byIso.get(country.iso) || ""}" style="stroke-width:${n(3 * scale)}" />${routeSvg}
      <g class="map-tag" data-fit="center" data-pad="${n(pad)}" data-lead="${n(pad + flagW)}">
        <rect x="${n(tagX)}" y="${n(tagY)}" width="${n(tagW)}" height="${n(tagH)}" rx="${n(tagH / 2)}" />
        <image href="${flagAsset(country)}" x="${n(tagX + pad)}" y="${n(tagY + (tagH - flagH) / 2)}" width="${n(flagW)}" height="${n(flagH)}" preserveAspectRatio="xMidYMid slice" />
        <text x="${n(tagX + pad * 2 + flagW)}" y="${n(tagY + tagH / 2)}" dominant-baseline="central" style="font-size:${n(font)}px">${country.name}</text>
      </g>${capitalSvg}${homeSvg}
    </svg>`;
  }

  // ── 우리나라와 견주기: 크기(같은 축척의 땅 모양) · 거리(비행기 시간) ──
  // 땅 모양: 나라 가운데를 기준으로 경도를 cos(위도)만큼 줄여 펼치면 넓이 비율이 거의 맞는다
  function countryOutline(country) {
    const rings = (worldMap.shapes.get(country.iso) || []);
    const rad = Math.PI / 180, k = Math.cos(country.lat * rad);
    const flat = rings.map(ring => ring.map(([lon, lat]) => {
      let d = lon - country.lon;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      return [d * k, country.lat - lat];
    }));
    if (!flat.length) return null;
    // 본토에서 멀리 떨어진 해외 땅(알래스카·하와이, 프랑스령 기아나 등)은 뺀다
    const middle = ring => [ring.reduce((sum, p) => sum + p[0], 0) / ring.length, ring.reduce((sum, p) => sum + p[1], 0) / ring.length];
    const span = ring => { const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]); return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)); };
    const main = flat.reduce((best, ring) => Math.hypot(...middle(ring)) < Math.hypot(...middle(best)) ? ring : best);
    const [mx, my] = middle(main), reach = Math.max(span(main) * 0.8, 10);
    const kept = flat.filter(ring => { const [x, y] = middle(ring); return Math.hypot(x - mx, y - my) <= reach; });
    const xs = kept.flat().map(p => p[0]), ys = kept.flat().map(p => p[1]);
    return { rings: kept, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }
  function outlinePath(outline, scale, ox, oy) {
    return outline.rings.map(ring => "M" + ring.map(([x, y]) => `${((x - outline.x0) * scale + ox).toFixed(1)} ${((y - outline.y0) * scale + oy).toFixed(1)}`).join("L") + "Z").join("");
  }
  function sizeCompareSvg(country) {
    const homeCountry = countries.find(item => item.id === HOME_ID);
    const home = homeCountry && countryOutline(homeCountry);
    const there = country.id === HOME_ID ? null : countryOutline(country);
    if (!home) return "";
    const W = 340, H = 170, gap = 26;
    if (!there) {
      // 우리나라를 열었을 때: 대한민국 땅 하나를 작은 나라(일본)와 큰 나라(중국) 사이에 두고 보여 준다
      const pick = id => { const item = countries.find(c => c.id === id); return item && countryOutline(item); };
      const jp = pick("jp"), cn = pick("cn");
      if (!jp || !cn) return "";
      const scale = Math.min((W - 60) / ((cn.x1 - cn.x0) + (jp.x1 - jp.x0) + (home.x1 - home.x0)), (H - 34) / (cn.y1 - cn.y0));
      const base = H - 30; let x = 4; let out = "";
      for (const [shape, name, cls, color] of [[cn, "중국", "size-there", "#d96a69"], [jp, "일본", "size-there", "#ea6f8a"], [home, "대한민국", "size-home", ""]]) {
        const w = (shape.x1 - shape.x0) * scale, h = (shape.y1 - shape.y0) * scale;
        out += `<path class="${cls}" ${color ? `style="fill:${color}"` : ""} d="${outlinePath(shape, scale, x, base - h)}" /><text class="size-label" x="${(x + w / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${name}</text>`;
        x += w + 26;
      }
      return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${out}</svg>`;
    }
    // 큰 나라에 맞춰 축척을 정하고, 우리나라도 같은 축척으로 그린다
    const tw = there.x1 - there.x0, th = there.y1 - there.y0, hw = home.x1 - home.x0, hh = home.y1 - home.y0;
    const scale = Math.min((W - gap - 70) / tw, (H - 34) / th);
    const tW = tw * scale, tH = th * scale, hW = hw * scale, hH = hh * scale;
    const base = H - 30; // 두 땅의 아래쪽을 맞춘다
    const tX = 4, hX = tX + tW + gap;
    const tiny = hW < 6 && hH < 6;
    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <path class="size-there" style="fill:${country.accent}" d="${outlinePath(there, scale, tX, base - tH)}" />
      <text class="size-label" x="${(tX + tW / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${country.name}</text>
      ${tiny ? `<circle class="size-home-dot" cx="${(hX + hW / 2).toFixed(1)}" cy="${(base - hH / 2).toFixed(1)}" r="9" />` : ""}
      <path class="size-home" d="${outlinePath(home, scale, hX, base - hH)}" />
      <text class="size-label" x="${(hX + Math.max(hW, 2) / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">대한민국</text>
    </svg>`;
  }
  function areaText(km2) {
    return km2 >= 10000 ? `약 ${Math.round(km2 / 10000).toLocaleString()}만 ㎢` : `약 ${km2.toLocaleString()} ㎢`;
  }
  function sizeSentence(country) {
    const here = areas[country.id], home = areas[HOME_ID];
    if (!here || !home) return "";
    if (country.id === HOME_ID) return `우리나라 넓이는 ${areaText(home)}예요. 이웃 나라와 같은 축척으로 견줘 봐요.`;
    const ratio = here / home;
    if (ratio < 0.95) return `대한민국의 약 ${Math.round(ratio * 10)}/10 크기예요.`;
    if (ratio < 1.05) return "대한민국과 거의 같은 크기예요.";
    const times = ratio < 10 ? Math.round(ratio * 10) / 10 : Math.round(ratio);
    return `대한민국 땅 <b>약 ${times}개</b>를 합친 만큼 넓어요.`;
  }
  // 서울에서 그 나라 수도까지 곧장 날아갈 때 (비행기 시속 약 800km + 뜨고 내리는 시간)
  function flightInfo(country) {
    const from = capitals[HOME_ID], to = capitals[country.id];
    if (!from || !to || country.id === HOME_ID) return null;
    const rad = Math.PI / 180;
    const a = Math.sin((to.lat - from.lat) * rad / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(to.lat * rad) * Math.sin((to.lon - from.lon) * rad / 2) ** 2;
    const km = Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) / 10) * 10;
    return { km, hours: Math.max(1, Math.round(km / 800 + 0.5)), to };
  }
  function compareHtml(country) {
    const flight = flightInfo(country);
    const blocks = flight ? Array.from({ length: flight.hours }, (_, i) => `<i style="--i:${i}"></i>`).join("") : "";
    return `<div class="compare-row">
        <section class="compare-card">
          <h3><span aria-hidden="true">📏</span> 얼마나 클까?</h3>
          <div id="sizeCompare" class="size-compare" role="img" aria-label="같은 축척으로 그린 ${country.name}${batchim(country.name) ? "과" : "와"} 대한민국 땅"></div>
          <p>${sizeSentence(country)}</p>
          ${country.id !== HOME_ID && areas[country.id] ? `<small>넓이 ${areaText(areas[country.id])} · 대한민국 ${areaText(areas[HOME_ID])}</small>` : ""}
        </section>
        <section class="compare-card">
          <h3><span aria-hidden="true">✈️</span> 얼마나 멀까?</h3>
          ${flight ? `<div class="flight-hours" role="img" aria-label="비행기로 약 ${flight.hours}시간"><span class="flight-from">🏠 서울</span><span class="flight-blocks">${blocks}<span class="flight-plane" aria-hidden="true">✈️</span></span><span class="flight-to">${flight.to.name}</span></div>
          <p>서울에서 곧장 날아가면 비행기로 <b>약 ${flight.hours}시간</b> 걸려요.</p>
          <small>한 칸이 1시간 · 거리 약 ${flight.km.toLocaleString()}km · 비행기를 갈아타면 더 걸려요</small>`
            : `<p class="compare-home">🏠 여기가 우리나라예요! 다른 나라를 열면 서울에서 비행기로 얼마나 걸리는지 보여 줘요.</p>`}
        </section>
      </div>`;
  }
  // 이름표 상자를 실제 글자 폭에 맞춘다 (영문·점이 섞인 이름은 어림값이 틀리므로)
  function fitMapLabels(holder) {
    holder.querySelectorAll("[data-fit]").forEach(group => {
      const rect = group.querySelector("rect"), text = group.querySelector("text");
      if (!rect || !text || !text.getComputedTextLength) return;
      const pad = Number(group.dataset.pad), lead = Number(group.dataset.lead);
      const width = lead + pad + text.getComputedTextLength() + pad;
      const x = Number(rect.getAttribute("x")), oldWidth = Number(rect.getAttribute("width"));
      const newX = group.dataset.fit === "left" ? x + oldWidth - width : group.dataset.fit === "center" ? x + (oldWidth - width) / 2 : x;
      const shift = newX - x;
      rect.setAttribute("x", newX.toFixed(1));
      rect.setAttribute("width", width.toFixed(1));
      group.querySelectorAll("text, image").forEach(item => item.setAttribute("x", (Number(item.getAttribute("x")) + shift).toFixed(1)));
    });
  }
  function renderWhereMap(country) {
    const holder = document.getElementById("whereMap");
    if (!holder) return;
    loadGeojson().then(geojson => {
      buildWorldMap(geojson);
      if (state.activeCountry === country && holder.isConnected) { holder.innerHTML = whereMapSvg(country); fitMapLabels(holder); }
      const sizeHolder = document.getElementById("sizeCompare");
      if (state.activeCountry === country && sizeHolder) sizeHolder.innerHTML = sizeCompareSvg(country);
    }).catch(() => { holder.classList.add("is-empty"); });
  }

  async function initGlobe() {
    els.globeError.hidden = true;
    els.globeLoading.hidden = false;
    try {
      if (typeof window.Globe !== "function") throw new Error("Globe.GL을 찾을 수 없습니다.");
      await loadGeojson();
      els.globeCanvas.innerHTML = "";
      state.globe = window.Globe({ animateIn: true, rendererConfig: { antialias: true, alpha: true } })(els.globeCanvas)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("./assets/ocean-paper-texture.png")
        .showAtmosphere(true)
        .atmosphereColor("#83ddf2")
        .atmosphereAltitude(0.15)
        .showGraticules(false)
        .polygonsData(state.geojson.features)
        .polygonCapColor(polygonColor)
        .polygonSideColor(feature => inFocusContinent(feature) ? "rgba(255,210,63,.95)" : "rgba(35,69,55,.55)")
        .polygonStrokeColor(polygonStroke)
        .polygonAltitude(polygonAlt)
        .polygonsTransitionDuration(300)
        .ringsData([])
        .ringLat("lat")
        .ringLng("lon")
        .ringColor(() => t => `rgba(255, 210, 63, ${1 - t})`)
        .ringMaxRadius(7)
        .ringPropagationSpeed(4)
        .ringRepeatPeriod(900)
        .ringAltitude(0.062)
        .htmlElementsData(globeMarkers())
        .htmlLat(marker => marker.country.lat)
        .htmlLng(marker => marker.country.lon)
        .htmlAltitude(marker => marker.kind === "pointer" ? 0.07 : marker.kind === "continent" ? 0.09 : 0.03)
        .htmlElement(markerElement)
        .htmlElementVisibilityModifier((element, visible) => {
          element.style.opacity = visible ? "" : "0";
          element.style.pointerEvents = visible && element.classList.contains("globe-flag") ? "auto" : "none";
        })
        .polygonLabel(feature => {
          const target = targetForFeature(feature);
          return target ? countryTooltip(target) : "";
        })
        .onPolygonClick(feature => {
          const target = targetForFeature(feature);
          if (target) openCountry(target.id);
          else showToast(`회색으로 표시된 ${countries.length}개 탐험 나라를 찾아 눌러 보자!`);
        })
        .onPolygonHover(feature => { els.globeCanvas.style.cursor = targetForFeature(feature) ? "pointer" : "grab"; })
        .pointsData(countries)
        .pointLat("lat")
        .pointLng("lon")
        .pointRadius(4.6)
        .pointAltitude(0.012)
        .pointColor(() => "rgba(0,0,0,0)")
        .pointLabel(countryTooltip)
        .onPointClick(country => openCountry(country.id))
        .onPointHover(country => { els.globeCanvas.style.cursor = country ? "pointer" : "grab"; });

      sizeGlobe();
      const canvas = els.globeCanvas.querySelector("canvas");
      if (canvas) {
        canvas.tabIndex = -1;
        canvas.setAttribute("aria-hidden", "true");
      }
      state.globe.pointOfView({ lat: 36.5, lng: 132.5, altitude: 1.62 }, 0);
      const controls = state.globe.controls();
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = false;
      controls.addEventListener("change", scheduleFlagEdges);
      // 버튼·국기로 돌릴 때(카메라 이동)도 놓치지 않게 가끔 다시 잰다
      window.setInterval(() => { if (state.view === "explore" && !document.hidden) scheduleFlagEdges(); }, 400);
      scheduleFlagEdges();
      if (state.globe.renderer) state.globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      state.resizeObserver = new ResizeObserver(sizeGlobe);
      state.resizeObserver.observe(els.globeWrap);
      if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
        window.__worldExplorerQA = { globe: state.globe, openCountry, pointCountry, countries, state };
      }
      els.globeLoading.hidden = true;
    } catch (error) {
      console.error(error);
      els.globeLoading.hidden = true;
      els.globeError.hidden = false;
    }
  }

  function refreshGlobe() {
    if (!state.globe || !state.geojson) return;
    state.globe
      .polygonCapColor(polygonColor)
      .polygonStrokeColor(polygonStroke)
      .polygonAltitude(polygonAlt)
      .polygonsData([...state.geojson.features]);
    state.globe.pointsData([...countries]);
    const pointed = countries.filter(country => country.id === state.pointed);
    state.globe.ringsData(pointed).htmlElementsData(globeMarkers());
    window.setTimeout(scheduleFlagEdges, 50);
  }

  function rotateBy(degrees) {
    if (!state.globe) return;
    const view = state.globe.pointOfView();
    state.globe.pointOfView({ lat: view.lat, lng: view.lng + degrees, altitude: view.altitude }, 550);
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function flyTo(country, duration = 750) {
    if (state.globe) state.globe.pointOfView({ lat: country.lat, lng: country.lon, altitude: 1.62 }, reduceMotion.matches ? 0 : duration);
  }

  // 국기를 누르면 바로 창을 열지 않고 지구본을 돌려 위치를 보여 준다. 창은 지구본에서 그 땅을 눌러야 열린다.
  let pointTimer;
  function pointCountry(id, { byKeyboard = false } = {}) {
    const country = countries.find(item => item.id === id);
    if (!country) return;
    if (!state.globe) { openCountry(id); return; }
    window.clearTimeout(pointTimer);
    state.pointed = id;
    state.focusContinent = null;
    document.querySelectorAll("[data-jump].is-active").forEach(button => { button.classList.remove("is-active"); button.setAttribute("aria-pressed", "false"); });
    refreshGlobe();
    flyTo(country, 1300);
    document.querySelectorAll("[data-country-shortcut]").forEach(button => button.classList.toggle("is-pointed", button.dataset.countryShortcut === id));
    els.guideTitle.textContent = "반짝이는 곳을 콕!";
    els.guideMessage.textContent = `지구본에서 노랗게 빛나는 ${country.name} 땅을 손가락으로 콕!`;
    const rect = els.globeWrap.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) els.globeWrap.scrollIntoView({ block: "center", behavior: reduceMotion.matches ? "auto" : "smooth" });
    if (state.soundOn) speakParts(SPEECH.point(country));
    // 키보드로는 지구본을 누를 수 없으므로 돌아간 뒤 창을 열어 준다
    if (byKeyboard) pointTimer = window.setTimeout(() => openCountry(id, { skipFly: true }), reduceMotion.matches ? 0 : 1400);
  }

  // 대륙 버튼: 국기 목록을 그 대륙으로 넘기고, 지구본도 그 대륙으로 돌려 땅을 표시한다
  function focusContinent(name) {
    const view = CONTINENT_VIEWS[name];
    clearPointed();
    state.focusContinent = name;
    document.querySelectorAll("[data-jump]").forEach(button => {
      const active = button.dataset.jump === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (!state.globe || !view) return;
    refreshGlobe();
    state.globe.pointOfView({ lat: view.lat, lng: view.lng, altitude: view.altitude }, reduceMotion.matches ? 0 : 1300);
    const total = countries.filter(country => continentOf(country) === name).length;
    els.guideTitle.textContent = `${name}에 왔어!`;
    els.guideMessage.textContent = `노란 테두리 안이 ${name}${batchim(name) ? "이야" : "야"}. 나라 ${total}개를 찾아봐!`;
    const rect = els.globeWrap.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) els.globeWrap.scrollIntoView({ block: "center", behavior: reduceMotion.matches ? "auto" : "smooth" });
    if (state.soundOn) speakParts(SPEECH.continent(name));
  }
  function clearContinent() {
    if (!state.focusContinent) return;
    state.focusContinent = null;
    document.querySelectorAll("[data-jump].is-active").forEach(button => { button.classList.remove("is-active"); button.setAttribute("aria-pressed", "false"); });
    refreshGlobe();
  }

  function clearPointed() {
    window.clearTimeout(pointTimer);
    if (!state.pointed) return;
    state.pointed = null;
    document.querySelectorAll("[data-country-shortcut].is-pointed").forEach(button => button.classList.remove("is-pointed"));
    refreshGlobe();
  }

  function renderProgress() {
    const count = state.discovered.size;
    const total = countries.length;
    els.progressText.textContent = `${count} / ${total}`;
    els.collectionCount.textContent = `${count} / ${total}`;
    els.progressBar.style.transform = `scaleX(${count / total})`;
    els.progressTrack.setAttribute("aria-valuemax", String(total));
    els.progressTrack.setAttribute("aria-valuenow", String(count));
    els.progressTrack.setAttribute("aria-valuetext", `${total}개 나라 중 ${count}개 도감 완성`);
    document.querySelectorAll("[data-country-shortcut]").forEach(button => {
      const found = state.discovered.has(button.dataset.countryShortcut);
      const country = countries.find(item => item.id === button.dataset.countryShortcut);
      button.classList.toggle("is-found", found);
      const status = button.querySelector("small");
      if (status) status.textContent = found ? "그림 받음" : "";
      if (country) button.setAttribute("aria-label", `${country.name} ${found ? "그림 받음" : "아직 못 감"} 탐험하기`);
    });
    document.querySelectorAll("[data-group-count]").forEach(counter => {
      const group = countriesByContinent().find(item => item.name === counter.dataset.groupCount);
      if (group) counter.textContent = `${group.list.filter(country => state.discovered.has(country.id)).length}/${group.list.length}`;
    });
    if (count === total) {
      els.goalText.textContent = "도감 완성!";
      els.guideTitle.textContent = "와, 지도를 모두 밝혔어!";
      els.guideMessage.textContent = "도감에서 좋아하는 나라를 다시 만나 보자.";
    } else {
      const next = count < 1 ? 1 : Math.min(total, Math.ceil((count + 1) / 3) * 3);
      els.goalText.textContent = `다음 목표 ${next}개`;
    }
  }

  function renderCountryShortcuts() {
    const rail = document.getElementById("countryShortcutRail");
    rail.setAttribute("aria-label", `${countries.length}개 나라 국기 목록`);
    const groups = countriesByContinent();
    rail.innerHTML = groups.map(group => `
      <section class="shortcut-group" id="shortcut-${group.name}" style="--continent:${group.color}" aria-label="${group.name}">
        <h3><span>${group.name}</span><small data-group-count="${group.name}"></small></h3>
        <div class="shortcut-grid">${group.list.map(country => `
          <button type="button" data-country-shortcut="${country.id}" aria-label="${country.name} 아직 못 감 탐험하기">
            <img src="${flagAsset(country)}" width="64" height="48" alt="" aria-hidden="true" />
            <span class="${nameClass(country)}">${country.name}<small></small></span>
          </button>`).join("")}</div>
      </section>`).join("");
    const jump = document.getElementById("continentJump");
    jump.innerHTML = groups.map(group => `<button type="button" data-jump="${group.name}" aria-pressed="false" style="--continent:${group.color}">${group.name}</button>`).join("");
    jump.querySelectorAll("[data-jump]").forEach(button => button.addEventListener("click", () => {
      const target = document.getElementById(`shortcut-${button.dataset.jump}`);
      if (!target) return;
      const vertical = rail.scrollHeight > rail.clientHeight + 4;
      rail.scrollTo(vertical ? { top: target.offsetTop - rail.offsetTop, behavior: "smooth" } : { left: target.offsetLeft - rail.offsetLeft, behavior: "smooth" });
      focusContinent(button.dataset.jump);
    }));
  }

  function renderCollection() {
    els.collectionGrid.innerHTML = countriesByContinent().map(group => {
      const foundCount = group.list.filter(country => state.discovered.has(country.id)).length;
      const cards = group.list.map((country, index) => {
        const tilt = [-4, 3, -2, 5, -3, 2][index % 6];
        if (state.discovered.has(country.id)) {
          return `<button type="button" class="country-card is-found" data-open-country="${country.id}" style="--tilt:${tilt}deg" aria-label="${country.name} ${landmarkName(country)} 그림 크게 보기"><span class="memory"><span class="memory-art" data-art>${artImg(country)}<span class="art-fallback" aria-hidden="true">${country.icon}</span><span class="zoom-chip" aria-hidden="true">🔍</span></span><span class="card-flag" aria-hidden="true"><img src="${flagAsset(country)}" width="64" height="48" alt="" /></span><h3 class="${nameClass(country)}">${country.name}</h3></span></button>`;
        }
        return `<div class="country-card is-locked" aria-label="아직 그림이 없는 ${country.name}"><span class="stamp-slot"><span class="locked-flag" aria-hidden="true"><img src="${flagAsset(country)}" width="64" height="48" alt="" /></span><h3 class="${nameClass(country)}">${country.name}</h3></span></div>`;
      }).join("");
      return `<section class="passport-page" style="--continent:${group.color}" aria-labelledby="page-${group.name}"><header><h2 id="page-${group.name}">${group.name}</h2><span>${foundCount} / ${group.list.length}</span></header><div class="stamp-grid">${cards}</div></section>`;
    }).join("");
    els.collectionGrid.querySelectorAll("[data-open-country]").forEach(button => button.addEventListener("click", () => openArt(button.dataset.openCountry)));
  }

  function openCountry(id, options = {}) {
    const country = countries.find(item => item.id === id);
    if (!country) return;
    clearPointed();
    clearContinent();
    state.activeCountry = country;
    state.missionIndex = 0;
    state.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!options.skipFly) flyTo(country);
    els.guideTitle.textContent = `${country.name}에 도착!`;
    els.guideMessage.textContent = state.discovered.has(id) ? `${country.place} 이야기를 다시 읽거나 퀴즈를 풀어 보자.` : `이야기를 읽고 퀴즈 ${country.missions.length}개에 도전해 보자!`;
    renderCountryIntro(country);
    els.dialog.hidden = false;
    setBackgroundInert(true);
    document.body.style.overflow = "hidden";
    window.setTimeout(() => els.dialog.querySelector("button")?.focus(), 40);
    if (state.soundOn) speakParts(SPEECH.arrival(country));
  }

  function renderCountryIntro(country) {
    const found = state.discovered.has(country.id);
    els.dialogContent.innerHTML = `
      <section style="--country-tint:${country.color};--country-accent:${country.accent}">
        <div class="country-hero">
          <div class="country-flag" aria-hidden="true"><img src="${flagAsset(country)}" width="640" height="480" alt="" /></div>
          <div class="hero-text"><p class="eyebrow">${country.region} · ${found ? "도감 다시 보기" : "새로운 나라 발견"}</p><h2 id="dialogTitle">${country.name}</h2><p>${country.story}</p></div>
          ${found ? `<button type="button" class="hero-art" data-art data-view-art="${country.id}" aria-label="${landmarkName(country)}에서 찍은 그림 크게 보기">${artImg(country)}<span class="art-fallback" aria-hidden="true">${country.icon}</span><span class="zoom-chip" aria-hidden="true">🔍</span></button>` : ""}
        </div>
        <figure class="where-map" style="--here:${country.accent}">
          <div id="whereMap" class="where-map-canvas" style="aspect-ratio:${MAP_W} / ${MAP_H}" role="img" aria-label="세계지도에 표시한 ${country.name}의 자리"></div>
          <figcaption>색칠된 곳이 ${country.name}${ieyo(country.name)}${capitals[country.id] ? ` · <span aria-hidden="true">📍</span> 핀이 수도 ${capitals[country.id].name}` : ""}</figcaption>
        </figure>
        ${compareHtml(country)}
        <dl class="country-quickfacts" style="--facts:${country.quickFacts.length}">${country.quickFacts.map(fact => `<div><dt>${fact[0]}</dt><dd>${fact[1]}</dd></div>`).join("")}</dl>
        ${country.cards ? guideCardsHtml(country, found) : `<div class="learning-grid">${country.chapters.map(chapter => `<article class="learning-card"><div class="learning-title"><span aria-hidden="true">${chapter.icon}</span><h3>${chapter.title}</h3></div><p>${chapter.summary}</p><ul>${chapter.details.map(detail => `<li>${detail}</li>`).join("")}</ul></article>`).join("")}</div>
        <aside class="remember-strip"><span aria-hidden="true">⭐</span><div><strong>이것만은 기억해요</strong><p>${country.remember}</p></div></aside>`}
        <div class="dialog-actions">
          <button type="button" class="speak-button" id="speakCountry">🔊 전체 이야기 듣기</button>
          <button type="button" class="primary-button" id="startMission">${found ? "퀴즈 다시 풀기" : `${country.missions.length}문제 퀴즈 시작`}</button>
        </div>
      </section>`;
    renderWhereMap(country);
    bindArtButtons();
    document.getElementById("speakCountry").addEventListener("click", () => {
      listen(SPEECH.story(country));
    });
    els.dialogContent.querySelectorAll("[data-greet]").forEach(button => button.addEventListener("click", () => {
      const line = country.greet.lines[Number(button.dataset.greet)];
      listen(SPEECH.greet(country, line));
    }));
    document.getElementById("startMission").addEventListener("click", () => renderMission(country, 0));
  }

  // ── 새 형식 나라 이야기 (country-guide.js): 원어 인사 + 이야기 카드 ──
  // "하늘·땅·물·불"처럼 가운뎃점으로 이은 말은 중간에서 줄이 끊기지 않게 한 덩어리로
  function keepDotted(text) { return text.replace(/[가-힣A-Za-z0-9]+(?:·[가-힣A-Za-z0-9]+)+/g, match => `<span class="nowrap">${match}</span>`); }
  function guideCardsHtml(country, found) {
    const greet = country.greet;
    const greetHtml = greet ? `
        <section class="greet-card" aria-label="인사 따라 하기">
          <div class="learning-title"><span aria-hidden="true">👋</span><div><small>인사 따라 하기</small><h3>눌러서 들어 보세요</h3></div></div>
          <div class="greet-lines">${greet.lines.map((line, i) => `<button type="button" class="greet-line" data-greet="${i}"><span class="greet-native" lang="${greet.lang}">${line.text}</span><span class="greet-say">${line.say}</span><span class="greet-mean">“${line.mean}”</span><span class="greet-play" aria-hidden="true">🔊</span></button>`).join("")}</div>
          ${greet.note ? `<p class="greet-note">${greet.note}</p>` : ""}
        </section>` : "";
    const cardHtml = card => `<article class="learning-card guide-card${card.wide ? " is-wide" : ""}">
          <div class="learning-title"><span aria-hidden="true">${card.icon}</span><div><small>${card.label}</small><h3>${card.title}</h3></div></div>
          ${card.label === "국기 속 비밀" ? `<figure class="guide-flag"><img src="${flagAsset(country)}" width="640" height="480" alt="${country.name} 국기" /></figure>` : ""}
          ${(card.lines || []).map(line => `<p>${keepDotted(line)}</p>`).join("")}${card.list ? `<ul>${card.list.map(item => `<li>${keepDotted(item)}</li>`).join("")}</ul>` : ""}
          ${card.wide && !found ? `<p class="card-reward"><span aria-hidden="true">📸</span> 퀴즈를 다 맞히면 두 형제가 여기서 찍은 그림을 받아요!</p>` : ""}
        </article>`;
    return `${greetHtml}<div class="learning-grid">${country.cards.map(cardHtml).join("")}</div>`;
  }
  function shuffled(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  }
  function optionInner(option) {
    const flagId = option[0].startsWith("flag:") ? option[0].slice(5) : null;
    if (flagId) return `<img class="option-flag" src="./assets/flags/${flagId}.svg" alt="${option[1]}" />`;
    return `<span class="option-emoji" aria-hidden="true">${option[0]}</span>${option[1]}`;
  }

  function renderMission(country, index = 0) {
    state.missionIndex = index;
    // 다 맞혔을 때 그림이 바로 뜨도록 퀴즈를 시작할 때 미리 받아 둔다
    if (index === 0) new Image().src = artAsset(country, "full");
    const mission = country.missions[index];
    // 보기 순서는 볼 때마다 섞는다 (진짜/가짜처럼 순서가 정해진 문제는 그대로)
    const ordered = mission.options.map((option, originalIndex) => ({ option, originalIndex }));
    const displayOptions = mission.keepOrder ? ordered : shuffled(ordered);
    const listenLine = mission.listen != null && country.greet ? country.greet.lines[mission.listen] : null;
    els.dialogContent.innerHTML = `
      <section class="mission-screen">
        <div class="mission-progress" aria-label="퀴즈 ${index + 1}/${country.missions.length}">
          <span>${index + 1} / ${country.missions.length}</span>
          <div>${country.missions.map((_, dotIndex) => `<i class="${dotIndex < index ? "is-done" : dotIndex === index ? "is-current" : ""}"></i>`).join("")}</div>
        </div>
        <div class="mission-badge">${mission.type}</div>
        <h2 id="dialogTitle">${mission.prompt}</h2>
        ${listenLine ? `<button type="button" class="speak-button listen-button" id="listenAgain">🔊 인사 들어 보기</button>` : ""}
        <p class="mission-hint" id="missionHint" role="status" aria-live="polite">천천히 보고 골라도 괜찮아요.</p>
        <div class="option-grid${displayOptions.length === 2 ? " is-two" : ""}">${displayOptions.map(({ option, originalIndex }) => `<button type="button" class="option-button" data-option="${originalIndex}" aria-pressed="false">${optionInner(option)}</button>`).join("")}</div>
        <div id="missionFeedback" class="mission-feedback" role="status" aria-live="polite"></div>
      </section>`;
    els.dialogContent.querySelectorAll("[data-option]").forEach(button => button.addEventListener("click", () => answerMission(country, mission, Number(button.dataset.option), button)));
    if (listenLine) {
      // 뜻을 맞히는 문제라 원어만 들려준다
      document.getElementById("listenAgain").addEventListener("click", () => listen(SPEECH.listen(country, listenLine)));
      if (state.soundOn) speakParts(SPEECH.listen(country, listenLine));
    }
    focusDialogTitle();
  }

  function answerMission(country, mission, choice, button) {
    if (choice === mission.answer) {
      els.dialogContent.querySelectorAll("[data-option]").forEach(option => { option.disabled = true; });
      button.classList.add("is-correct");
      button.setAttribute("aria-pressed", "true");
      document.getElementById("missionHint").textContent = "정답이에요. 아래 설명까지 읽어 보세요.";
      const finalQuestion = state.missionIndex === country.missions.length - 1;
      const feedback = document.getElementById("missionFeedback");
      feedback.innerHTML = `<div><span aria-hidden="true">${finalQuestion ? "🏆" : "💡"}</span><p>${mission.explain}</p></div><button type="button" class="primary-button" id="nextMission">${finalQuestion ? "도감 열기" : "다음 문제"}</button>`;
      document.getElementById("nextMission").addEventListener("click", () => {
        if (!finalQuestion) { renderMission(country, state.missionIndex + 1); return; }
        state.discovered.add(country.id);
        saveProgress();
        refreshGlobe();
        renderProgress();
        renderCollection();
        showSuccess(country);
        launchConfetti();
        if (state.soundOn) speakParts(SPEECH.success(country));
      });
    } else {
      button.classList.add("is-wrong");
      button.disabled = true;
      button.setAttribute("aria-pressed", "true");
      document.getElementById("missionHint").textContent = `다시 생각해 볼까요? 힌트: ${mission.hint}`;
      if (navigator.vibrate) navigator.vibrate(60);
    }
  }

  function showSuccess(country) {
    els.dialogContent.innerHTML = `<section class="success-screen" style="--continent:${regionColors[continentOf(country)]}"><figure class="success-art" data-art>${artImg(country, "full")}<span class="art-fallback" aria-hidden="true">${country.icon}</span><button type="button" class="success-zoom" data-view-art="${country.id}" aria-label="그림 크게 보기">🔍 크게 보기</button><span class="success-stamp" aria-hidden="true"><span class="card-icon">${country.icon}</span><b class="${nameClass(country)}">${country.name}</b></span></figure><p class="eyebrow">${country.missions.length}문제를 모두 맞혔어요 · ${landmarkName(country)}</p><h2 id="dialogTitle">${country.name} 그림이 도감에 쏙!</h2><p>지구본의 ${country.name} 자리에도 이 그림이 붙었어요.</p><button type="button" class="primary-button" id="continueExplore">${state.discovered.size === countries.length ? "완성한 도감 보기" : "다음 나라 찾기"}</button></section>`;
    bindArtButtons();
    document.getElementById("continueExplore").addEventListener("click", () => {
      const complete = state.discovered.size === countries.length;
      closeCountryDialog();
      if (complete) setView("collection");
    });
  }

  // ── 손으로 그린 그림 크게 보기 (그림을 누르면 누른 곳이 두 배로 확대) ──
  const artViewer = {
    root: document.getElementById("artViewer"), img: document.getElementById("artViewerImg"), frame: document.getElementById("artViewerFrame"),
    title: document.getElementById("artViewerTitle"), place: document.getElementById("artViewerPlace"), flag: document.getElementById("artViewerFlag"),
    story: document.getElementById("artViewerStory"), countryId: null, returnFocus: null, fromDialog: false
  };
  function bindArtButtons() {
    els.dialogContent.querySelectorAll("[data-view-art]").forEach(button => button.addEventListener("click", () => openArt(button.dataset.viewArt)));
  }
  function openArt(id) {
    const country = countries.find(item => item.id === id);
    if (!country) return;
    artViewer.countryId = id;
    artViewer.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    artViewer.fromDialog = !els.dialog.hidden;
    artViewer.frame.classList.remove("is-zoomed", "no-art");
    artViewer.img.hidden = false;
    artViewer.img.src = artAsset(country, "full");
    artViewer.img.alt = `${landmarkName(country)} 앞에서 찍은 그림`;
    artViewer.frame.querySelector(".art-fallback").textContent = country.icon;
    artViewer.flag.src = flagAsset(country);
    artViewer.title.textContent = country.name;
    artViewer.place.textContent = landmarkName(country);
    artViewer.story.hidden = artViewer.fromDialog;
    artViewer.root.hidden = false;
    setBackgroundInert(true);
    els.dialog.inert = true;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => document.getElementById("artViewerClose").focus(), 40);
  }
  function closeArt() {
    if (artViewer.root.hidden) return;
    artViewer.root.hidden = true;
    els.dialog.inert = false;
    if (!artViewer.fromDialog) { setBackgroundInert(false); document.body.style.overflow = ""; }
    const target = artViewer.returnFocus;
    if (target && target.isConnected) window.setTimeout(() => target.focus(), 0);
  }
  function setupArtViewer() {
    artViewer.img.addEventListener("error", () => { artViewer.frame.classList.add("no-art"); artViewer.img.hidden = true; });
    artViewer.frame.addEventListener("click", event => {
      if (artViewer.frame.classList.contains("no-art")) return;
      const zoomed = artViewer.frame.classList.toggle("is-zoomed");
      if (zoomed) {
        const rect = artViewer.img.getBoundingClientRect();
        artViewer.img.style.transformOrigin = `${((event.clientX - rect.left) / rect.width * 100).toFixed(0)}% ${((event.clientY - rect.top) / rect.height * 100).toFixed(0)}%`;
      }
    });
    document.getElementById("artViewerClose").addEventListener("click", closeArt);
    document.getElementById("artViewerX").addEventListener("click", closeArt);
    artViewer.root.addEventListener("click", event => { if (event.target === artViewer.root) closeArt(); });
    artViewer.story.addEventListener("click", () => {
      const id = artViewer.countryId;
      artViewer.returnFocus = null;
      closeArt();
      openCountry(id, { skipFly: true });
    });
  }

  function closeCountryDialog() {
    stopSpeaking();
    els.dialog.hidden = true;
    setBackgroundInert(false);
    document.body.style.overflow = "";
    els.guideTitle.textContent = state.discovered.size === countries.length ? "세계지도 완성!" : "다음에는 어디로 갈까?";
    els.guideMessage.textContent = state.discovered.size === countries.length ? `도감에서 ${countries.length}개 나라 이야기를 다시 볼 수 있어.` : "지구본을 다시 돌려 아직 회색인 나라를 찾아보자!";
    restoreFocus();
  }

  function setView(view) {
    state.view = view;
    document.getElementById("exploreView").hidden = view !== "explore";
    document.getElementById("collectionView").hidden = view !== "collection";
    document.querySelectorAll(".view-tab").forEach(tab => {
      const active = tab.dataset.view === view;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    if (view === "explore") window.setTimeout(() => { sizeGlobe(); if (state.globe) state.globe.resumeAnimation(); }, 30);
    else if (state.globe) state.globe.pauseAnimation();
    window.scrollTo(0, 0);
  }


  const soundButtons = () => [els.soundButton, document.getElementById("dialogSound")].filter(Boolean);
  function showSoundState() {
    soundButtons().forEach(button => {
      button.textContent = state.soundOn ? "🔊" : "🔇";
      button.setAttribute("aria-pressed", String(state.soundOn));
      button.setAttribute("aria-label", state.soundOn ? "소리 끄기" : "소리 켜기");
    });
  }
  // 소리를 끄면 읽고 있던 것(전체 이야기 듣기 포함)을 바로 멈춘다
  function setSound(on) {
    state.soundOn = on;
    try { localStorage.setItem(SOUND_KEY, on ? "on" : "off"); } catch (_) { /* 저장을 쓸 수 없는 환경 */ }
    showSoundState();
    if (!on) stopSpeaking();
  }
  let speechRun = 0;
  let currentUtterance = null;
  function stopSpeaking() {
    speechRun += 1;
    voicePlayer.onended = voicePlayer.onerror = null;
    voicePlayer.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  // 🔊 버튼처럼 아이가 직접 들으려고 누른 것: 소리가 꺼져 있으면 켜고 읽는다
  function listen(parts) {
    if (!state.soundOn) setSound(true);
    speakParts(parts);
  }

  // 여러 조각을 한 조각씩 이어서 읽는다(한꺼번에 줄 세우면 기기에 따라 끈 뒤에도 남은 조각을 읽는다).
  // 미리 녹음한 소리(assets/voice/, 선희 + 원어 목소리)가 있으면 그걸 틀고, 없거나 못 틀면 기기 목소리로 읽는다.
  function speakParts(parts) {
    stopSpeaking();
    if (!state.soundOn) return;
    const run = speechRun;
    const queue = parts.slice();
    const next = () => {
      if (run !== speechRun || !state.soundOn || !queue.length) return;
      const part = queue.shift();
      const src = recordedSrc(part);
      const device = () => { if (run === speechRun) speakDevice(part, next); };
      if (src) playRecorded(src, next, device); else device();
    };
    next();
  }
  function recordedSrc(part) {
    for (const key of [SPEECH.voiceKey(part), SPEECH.fallbackKey(part)]) {
      if (key && recordedVoice.has(SPEECH.hash(key))) return `./assets/voice/${SPEECH.hash(key)}.mp3`;
    }
    return null;
  }
  function playRecorded(src, done, fail) {
    let settled = false;
    const once = callback => () => { if (settled) return; settled = true; voicePlayer.onended = voicePlayer.onerror = null; callback(); };
    voicePlayer.onended = once(done);
    voicePlayer.onerror = once(fail);
    voicePlayer.src = src;
    const playing = voicePlayer.play();
    if (playing && playing.catch) playing.catch(once(fail));
  }
  // 원어 조각은 그 나라 말 목소리로 읽고, 기기에 그 목소리가 없으면 한글 발음(say)을 한국어 목소리로 읽는다.
  function speakDevice(part, done) {
    if (!("speechSynthesis" in window)) { done(); return; }
    const voices = window.speechSynthesis.getVoices();
    const utterance = new SpeechSynthesisUtterance(part.text);
    utterance.lang = "ko-KR";
    utterance.rate = part.rate || 0.88;
    utterance.pitch = 1.08;
    if (part.lang) {
      const voice = voiceFor(voices, part.lang);
      if (voice) { try { utterance.voice = voice; } catch (error) { /* 목소리를 못 고르면 lang만으로 읽는다 */ } utterance.lang = voice.lang; }
      else if (voices.length && part.say) utterance.text = part.say;
      else utterance.lang = part.lang;
    }
    currentUtterance = utterance; // 붙잡아 두지 않으면 일부 브라우저가 onend를 잃어버린다
    utterance.onend = done;
    utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  }
  function voiceFor(voices, lang) {
    const norm = value => value.replace("_", "-").toLowerCase();
    const want = norm(lang);
    return voices.find(voice => norm(voice.lang) === want) || voices.find(voice => norm(voice.lang).split("-")[0] === want.split("-")[0]) || null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.getVoices(); // 목소리 목록을 미리 불러 둔다

  let toastTimer;
  function showToast(message) {
    window.clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = window.setTimeout(() => { els.toast.hidden = true; }, 2400);
  }

  function launchConfetti() {
    const colors = ["#f6c943", "#ee7d2c", "#4bbfb6", "#5875d8", "#e75f67"];
    els.confetti.innerHTML = Array.from({ length: 40 }, (_, index) => `<i style="left:${(index * 29) % 100}%;background:${colors[index % colors.length]};--drift:${(index % 2 ? 1 : -1) * (25 + index % 55)}px;animation-delay:${(index % 9) * 0.045}s"></i>`).join("");
    window.setTimeout(() => { els.confetti.innerHTML = ""; }, 2200);
  }

  function setupKidSafeGuards() {
    const isAdultControl = target => target instanceof Element && Boolean(target.closest("[data-adult-control], input, textarea, [contenteditable='true']"));
    ["gesturestart", "gesturechange", "gestureend"].forEach(type => document.addEventListener(type, event => event.preventDefault(), { passive: false }));
    document.addEventListener("touchstart", event => { if (event.touches.length > 1) event.preventDefault(); }, { passive: false });
    document.addEventListener("touchmove", event => { if (event.touches.length > 1) event.preventDefault(); }, { passive: false });
    let lastTouchEnd = 0;
    document.addEventListener("touchend", event => {
      const now = Date.now();
      if (!isAdultControl(event.target) && now - lastTouchEnd <= 320) event.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });
    document.addEventListener("contextmenu", event => { if (!isAdultControl(event.target)) event.preventDefault(); });
    document.addEventListener("selectstart", event => { if (!isAdultControl(event.target)) event.preventDefault(); });
    document.addEventListener("dragstart", event => { if (!isAdultControl(event.target)) event.preventDefault(); });
    ["copy", "cut", "paste"].forEach(type => document.addEventListener(type, event => { if (!isAdultControl(event.target)) event.preventDefault(); }));
  }

  function setBackgroundInert(inert) {
    document.querySelectorAll(".topbar, main, .bottom-nav").forEach(element => { element.inert = inert; });
  }

  function restoreFocus() {
    const target = state.returnFocus;
    state.returnFocus = null;
    if (target && target.isConnected) window.setTimeout(() => target.focus(), 0);
  }

  function focusDialogTitle() {
    window.setTimeout(() => {
      const title = els.dialogContent.querySelector("#dialogTitle");
      if (!title) return;
      title.tabIndex = -1;
      title.focus();
    }, 0);
  }

  function trapFocus(container, event) {
    if (event.key !== "Tab") return;
    const focusable = [...container.querySelectorAll('button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')].filter(element => !element.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function closeGuardian() {
    els.guardianDialog.hidden = true;
    setBackgroundInert(false);
    document.body.style.overflow = "";
    restoreFocus();
  }

  function bindEvents() {
    document.getElementById("rotateLeft").addEventListener("click", () => rotateBy(-35));
    document.getElementById("rotateRight").addEventListener("click", () => rotateBy(35));
    document.querySelectorAll("[data-country-shortcut]").forEach(button => button.addEventListener("click", event => pointCountry(button.dataset.countryShortcut, { byKeyboard: event.detail === 0 })));
    document.getElementById("retryGlobe").addEventListener("click", initGlobe);
    document.querySelectorAll(".view-tab").forEach(tab => tab.addEventListener("click", () => setView(tab.dataset.view)));
    document.getElementById("closeDialog").addEventListener("click", closeCountryDialog);
    els.dialog.addEventListener("click", event => { if (event.target === els.dialog) closeCountryDialog(); });
    document.getElementById("guardianButton").addEventListener("click", () => {
      state.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      els.guardianAnswer.value = "";
      els.guardianError.textContent = "";
      els.guardianDialog.hidden = false;
      setBackgroundInert(true);
      document.body.style.overflow = "hidden";
      window.setTimeout(() => document.getElementById("closeGuardian").focus(), 40);
    });
    document.getElementById("closeGuardian").addEventListener("click", closeGuardian);
    els.guardianDialog.addEventListener("click", event => { if (event.target === els.guardianDialog) closeGuardian(); });
    document.getElementById("resetProgress").addEventListener("click", () => {
      if (els.guardianAnswer.value.trim() !== "13") { els.guardianError.textContent = "계산 결과를 다시 확인해 주세요."; return; }
      state.discovered.clear();
      saveProgress();
      refreshGlobe();
      renderProgress();
      renderCollection();
      closeGuardian();
      setView("explore");
      showToast("탐험 기록을 처음으로 돌렸어요.");
    });
    showSoundState();
    soundButtons().forEach(button => button.addEventListener("click", () => {
      setSound(!state.soundOn);
      if (state.soundOn) speakParts(SPEECH.soundOn());
    }));
    document.addEventListener("visibilitychange", () => {
      if (!state.globe) return;
      if (document.hidden) state.globe.pauseAnimation();
      else if (state.view === "explore") state.globe.resumeAnimation();
    });
    document.addEventListener("keydown", event => {
      const activeDialog = !artViewer.root.hidden ? artViewer.root : !els.guardianDialog.hidden ? els.guardianDialog : !els.dialog.hidden ? els.dialog : null;
      if (activeDialog) trapFocus(activeDialog, event);
      if (event.key === "Escape") {
        if (!artViewer.root.hidden) closeArt();
        else if (!els.guardianDialog.hidden) closeGuardian();
        else if (!els.dialog.hidden) closeCountryDialog();
      }
    });
    document.querySelectorAll(".view-tab").forEach(tab => tab.addEventListener("keydown", event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const targetView = tab.dataset.view === "explore" ? "collection" : "explore";
      setView(targetView);
      document.querySelector(`.view-tab[data-view="${targetView}"]`).focus();
    }));
  }

  function setupMascot() {
    const image = document.getElementById("mascotImage");
    const fallback = document.getElementById("mascotFallback");
    image.addEventListener("load", () => { image.hidden = false; fallback.hidden = true; });
    image.addEventListener("error", () => { image.hidden = true; fallback.hidden = false; });
    if (image.complete && image.naturalWidth) { image.hidden = false; fallback.hidden = true; }
  }

  // 패드가 옛 파일을 붙들고 있어도 새 버전이 나온 걸 알 수 있게 한다
  const APP_VERSION = document.querySelector('meta[name="app-version"]')?.content || "";
  let lastUpdateCheck = 0;
  async function checkUpdate() {
    if (location.protocol === "file:" || !navigator.onLine || Date.now() - lastUpdateCheck < 60000) return;
    lastUpdateCheck = Date.now();
    try {
      const response = await fetch(`${location.pathname}?v=${Date.now()}`, { cache: "no-store" });
      const latest = (await response.text()).match(/name="app-version" content="([^"]+)"/)?.[1];
      if (latest && latest !== APP_VERSION && els.updateButton.hidden) {
        els.updateButton.hidden = false;
        showToast("새 버전이 나왔어요! 위쪽 🎁 버튼을 눌러 주세요.");
      }
    } catch (_) { /* 연결이 끊겼으면 다음에 다시 확인 */ }
  }
  function setupUpdateCheck() {
    els.updateButton = document.getElementById("updateButton");
    document.getElementById("appVersion").textContent = `v${APP_VERSION}`;
    document.getElementById("guardianVersion").textContent = `버전 v${APP_VERSION}`;
    els.updateButton.addEventListener("click", () => location.replace(`${location.pathname}?v=${Date.now()}`));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) checkUpdate(); });
    window.addEventListener("online", checkUpdate);
    window.setInterval(checkUpdate, 600000);
    checkUpdate();
  }

  setupKidSafeGuards();
  setupUpdateCheck();
  setupArtViewer();
  renderCountryShortcuts();
  bindEvents();
  setupMascot();
  renderProgress();
  renderCollection();
  initGlobe();
})();
