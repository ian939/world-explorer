(function () {
  "use strict";

  const STORAGE_KEY = "world-explorer-progress-v1";
  const countries = [
    {
      id: "kr", name: "대한민국", region: "아시아", lat: 36, lon: 127, flag: "🇰🇷", icon: "🐯", color: "#ffe4c4", accent: "#ff8a3d",
      hello: "안녕하세요!", place: "한라산", nature: "봄·여름·가을·겨울이 뚜렷해요.", story: "산과 바다, 크고 작은 도시가 어우러진 나라예요.",
      facts: [["🗣️", "인사말", "‘안녕하세요’ 하고 인사해요."], ["🏔️", "자연", "섬에 우뚝 솟은 한라산이 있어요."], ["🥁", "문화", "흥겨운 장단과 춤을 즐겨요."]],
      mission: { type: "소리 탐정", prompt: "대한민국에서 만난 친구에게 어떻게 인사할까?", options: [["👋", "안녕하세요"], ["🌞", "봉주르"], ["🌺", "알로하"]], answer: 0, hint: "우리도 자주 쓰는 다섯 글자 인사예요." }
    },
    {
      id: "jp", name: "일본", region: "아시아", lat: 37, lon: 138, flag: "🇯🇵", icon: "🌸", color: "#ffe0e9", accent: "#f06283",
      hello: "곤니치와!", place: "후지산", nature: "길고 좁은 섬들이 이어져 있어요.", story: "바다로 둘러싸인 여러 섬으로 이루어진 나라예요.",
      facts: [["🗣️", "인사말", "‘곤니치와’ 하고 인사해요."], ["🗻", "자연", "높고 아름다운 후지산이 있어요."], ["🌸", "계절", "봄에는 벚꽃이 활짝 피어요."]],
      mission: { type: "관찰 탐정", prompt: "일본에서 볼 수 있는 높은 산은 무엇일까?", options: [["🗻", "후지산"], ["🏜️", "사하라 사막"], ["🌊", "나이아가라 폭포"]], answer: 0, hint: "눈 덮인 산 그림을 찾아보세요." }
    },
    {
      id: "cn", name: "중국", region: "아시아", lat: 35, lon: 105, flag: "🇨🇳", icon: "🐼", color: "#ffe2b8", accent: "#d8523d",
      hello: "니하오!", place: "만리장성", nature: "아주 넓어서 지역마다 날씨와 모습이 달라요.", story: "높은 산, 넓은 평야, 큰 도시를 모두 만날 수 있어요.",
      facts: [["🗣️", "인사말", "‘니하오’ 하고 인사해요."], ["🐼", "동물", "대나무를 좋아하는 판다가 살아요."], ["🧱", "건축물", "아주 긴 만리장성이 이어져 있어요."]],
      mission: { type: "동물 친구", prompt: "중국의 대나무 숲에서 만날 수 있는 동물은?", options: [["🦘", "캥거루"], ["🐼", "판다"], ["🦁", "사자"]], answer: 1, hint: "검은색과 흰색 털을 가진 동물이에요." }
    },
    {
      id: "in", name: "인도", region: "아시아", lat: 22, lon: 78, flag: "🇮🇳", icon: "🐘", color: "#fff0b9", accent: "#e99128",
      hello: "나마스테!", place: "타지마할", nature: "북쪽에는 높은 히말라야산맥이 있어요.", story: "다양한 말과 음식, 음악을 만날 수 있는 큰 나라예요.",
      facts: [["🗣️", "인사말", "두 손을 모아 ‘나마스테’라고 해요."], ["🏛️", "건축물", "하얀 대리석의 타지마할이 있어요."], ["🪷", "자연", "연꽃은 인도를 상징하는 꽃이에요."]],
      mission: { type: "몸짓 따라하기", prompt: "인도에서 ‘나마스테’라고 인사할 때 어울리는 모습은?", options: [["🙏", "두 손 모으기"], ["🙈", "두 눈 가리기"], ["🕺", "한 바퀴 돌기"]], answer: 0, hint: "양손을 가슴 앞에 모아 보세요." }
    },
    {
      id: "eg", name: "이집트", region: "아프리카", lat: 27, lon: 30, flag: "🇪🇬", icon: "🐫", color: "#ffe5a9", accent: "#c77b24",
      hello: "아흘란!", place: "피라미드", nature: "넓은 사막을 나일강이 지나가요.", story: "오래된 피라미드와 사막을 만날 수 있는 나라예요.",
      facts: [["🏜️", "자연", "국토의 많은 부분이 사막이에요."], ["🔺", "건축물", "아주 오래된 피라미드가 있어요."], ["🌊", "강", "나일강 주변에는 초록 식물이 자라요."]],
      mission: { type: "여행 가방", prompt: "뜨거운 사막을 여행할 때 꼭 챙기면 좋은 것은?", options: [["🧣", "두꺼운 털목도리"], ["🧴", "물과 햇빛 가리개"], ["⛸️", "스케이트"]], answer: 1, hint: "햇빛이 강하고 물이 귀한 곳이에요." }
    },
    {
      id: "ke", name: "케냐", region: "아프리카", lat: 0, lon: 37, flag: "🇰🇪", icon: "🦒", color: "#dff3bb", accent: "#5d9a45",
      hello: "잠보!", place: "사바나", nature: "넓은 초원에서 다양한 야생동물이 살아요.", story: "적도가 지나고, 초원과 높은 산이 함께 있는 나라예요.",
      facts: [["🗣️", "인사말", "스와힐리어로 ‘잠보’라고 인사해요."], ["🦒", "동물", "기린과 코끼리가 초원을 걸어요."], ["🌾", "자연", "풀이 넓게 펼쳐진 사바나가 있어요."]],
      mission: { type: "서식지 찾기", prompt: "케냐의 사바나에서 만날 수 있는 동물은?", options: [["🐧", "펭귄"], ["🦒", "기린"], ["🐼", "판다"]], answer: 1, hint: "목이 길어서 높은 나뭇잎도 먹을 수 있어요." }
    },
    {
      id: "fr", name: "프랑스", region: "유럽", lat: 46, lon: 2, flag: "🇫🇷", icon: "🗼", color: "#dfe9ff", accent: "#536fd1",
      hello: "봉주르!", place: "에펠탑", nature: "산과 들판, 대서양과 지중해를 만나요.", story: "예술과 건축, 여러 지역의 음식으로 알려진 나라예요.",
      facts: [["🗣️", "인사말", "‘봉주르’ 하고 인사해요."], ["🗼", "건축물", "파리에는 높다란 에펠탑이 있어요."], ["🎨", "예술", "많은 미술관에서 작품을 만날 수 있어요."]],
      mission: { type: "그림자 찾기", prompt: "프랑스 파리의 유명한 탑은 무엇일까?", options: [["🗼", "에펠탑"], ["🗿", "모아이 석상"], ["🛕", "타지마할"]], answer: 0, hint: "철로 만든 아주 높은 탑이에요." }
    },
    {
      id: "it", name: "이탈리아", region: "유럽", lat: 42, lon: 12, flag: "🇮🇹", icon: "🏛️", color: "#dcf3dc", accent: "#4e9b67",
      hello: "차오!", place: "콜로세움", nature: "지도에서 장화처럼 생긴 반도예요.", story: "오래된 도시와 예술 작품이 많이 남아 있는 나라예요.",
      facts: [["🗣️", "인사말", "‘차오’는 만날 때도 헤어질 때도 써요."], ["🏛️", "건축물", "로마에는 둥근 콜로세움이 있어요."], ["🌋", "자연", "지금도 활동하는 화산이 있어요."]],
      mission: { type: "모양 탐정", prompt: "세계지도에서 이탈리아는 무엇을 닮았을까?", options: [["🥾", "긴 장화"], ["🎩", "둥근 모자"], ["🧤", "털장갑"]], answer: 0, hint: "발에 신는 물건을 떠올려 보세요." }
    },
    {
      id: "gb", name: "영국", region: "유럽", lat: 55, lon: -3, flag: "🇬🇧", icon: "🕰️", color: "#e8e3ff", accent: "#6c5fc7",
      hello: "헬로!", place: "빅벤", nature: "바다에 있는 여러 섬으로 이루어져 있어요.", story: "오래된 성과 현대적인 도시가 함께 있는 섬나라예요.",
      facts: [["🗣️", "인사말", "영어로 ‘헬로’라고 인사해요."], ["🕰️", "건축물", "런던의 큰 시계탑을 빅벤이라 불러요."], ["🌧️", "날씨", "구름과 비를 자주 만날 수 있어요."]],
      mission: { type: "시간 탐정", prompt: "영국 런던에서 볼 수 있는 커다란 시계탑은?", options: [["🕰️", "빅벤"], ["🔺", "피라미드"], ["⛩️", "도리이"]], answer: 0, hint: "‘땡땡’ 시간을 알려 주는 건축물이에요." }
    },
    {
      id: "us", name: "미국", region: "아메리카", lat: 39, lon: -98, flag: "🇺🇸", icon: "🦅", color: "#ffe0df", accent: "#cf5460",
      hello: "헬로!", place: "그랜드캐니언", nature: "넓은 땅에 사막, 숲, 산과 강이 모두 있어요.", story: "북아메리카의 넓은 지역에 걸쳐 있는 나라예요.",
      facts: [["🦅", "동물", "흰머리수리는 미국을 상징해요."], ["🏞️", "자연", "그랜드캐니언의 거대한 협곡이 있어요."], ["🚀", "과학", "여러 우주 탐사에 도전해 왔어요."]],
      mission: { type: "자연 탐정", prompt: "미국의 붉고 거대한 협곡은 무엇일까?", options: [["🏞️", "그랜드캐니언"], ["🌊", "아마존강"], ["🗻", "후지산"]], answer: 0, hint: "강물이 아주 오랜 시간 깎아 만든 깊은 골짜기예요." }
    },
    {
      id: "br", name: "브라질", region: "아메리카", lat: -10, lon: -52, flag: "🇧🇷", icon: "🦜", color: "#dbf6d1", accent: "#3d9e59",
      hello: "올라!", place: "아마존 열대우림", nature: "크고 긴 아마존강과 울창한 숲이 있어요.", story: "남아메리카에서 가장 넓은 나라예요.",
      facts: [["🗣️", "인사말", "포르투갈어로 ‘올라’라고 인사해요."], ["🌳", "자연", "아마존 열대우림이 넓게 펼쳐져요."], ["🦜", "동물", "화려한 깃털의 새들이 살아요."]],
      mission: { type: "숲속 탐험", prompt: "브라질의 아마존 열대우림에 어울리는 모습은?", options: [["🌳", "울창한 숲"], ["🧊", "얼음 벌판"], ["🏜️", "모래 사막"]], answer: 0, hint: "비가 많이 내리고 나무가 빽빽하게 자라요." }
    },
    {
      id: "au", name: "호주", region: "오세아니아", lat: -25, lon: 134, flag: "🇦🇺", icon: "🦘", color: "#d8f2f1", accent: "#289c9c",
      hello: "그데이!", place: "그레이트배리어리프", nature: "사막과 열대우림, 산호초를 모두 만날 수 있어요.", story: "하나의 나라가 큰 대륙 대부분을 차지하고 있어요.",
      facts: [["🦘", "동물", "캥거루는 큰 뒷다리로 폴짝 뛰어요."], ["🐠", "바다", "아름다운 산호초에 많은 생물이 살아요."], ["🗣️", "인사말", "친근하게 ‘그데이’라고 인사하기도 해요."]],
      mission: { type: "동물 친구", prompt: "호주에서 태어나 자라는 대표 동물은?", options: [["🐼", "판다"], ["🦘", "캥거루"], ["🦒", "기린"]], answer: 1, hint: "주머니가 있고 폴짝폴짝 뛰는 동물이에요." }
    }
  ];

  const regionColors = { "아시아": "#f2a943", "유럽": "#7486e8", "아프리카": "#61b96f", "아메리카": "#e86f78", "오세아니아": "#34aaa8" };
  const landShapes = [
    [[-168,72],[-142,68],[-125,52],[-105,50],[-92,35],[-82,25],[-100,18],[-119,32],[-136,55]],
    [[-82,13],[-67,10],[-50,-5],[-37,-20],[-54,-55],[-70,-43],[-77,-15]],
    [[-11,36],[4,49],[26,58],[48,55],[62,44],[88,46],[116,52],[150,59],[171,50],[151,36],[121,21],[100,8],[78,22],[57,16],[37,30],[20,32]],
    [[-17,34],[9,37],[32,31],[51,11],[41,-12],[28,-34],[14,-35],[2,-12],[-12,10]],
    [[113,-11],[152,-10],[154,-29],[136,-40],[115,-32]],
    [[-52,83],[-18,78],[-27,62],[-48,60]],
    [[47,-13],[51,-26],[44,-25]],
    [[130,31],[145,44],[143,32]],
    [[-10,58],[2,58],[-3,50]],
    [[166,-35],[178,-39],[173,-47]]
  ];

  const state = {
    discovered: loadProgress(), centerLon: 126, dragging: false, dragStartX: 0, dragStartLon: 0,
    activeCountry: null, failedOptions: new Set(), soundOn: false, view: "explore"
  };

  const els = {
    globe: document.getElementById("globeWrap"), canvas: document.getElementById("globeCanvas"), markers: document.getElementById("countryMarkers"),
    progressText: document.getElementById("progressText"), progressBar: document.getElementById("progressBar"), goalText: document.getElementById("goalText"),
    guideTitle: document.getElementById("guideTitle"), guideMessage: document.getElementById("guideMessage"), collectionCount: document.getElementById("collectionCount"),
    collectionGrid: document.getElementById("collectionGrid"), dialog: document.getElementById("countryDialog"), dialogContent: document.getElementById("dialogContent"),
    guardianDialog: document.getElementById("guardianDialog"), guardianAnswer: document.getElementById("guardianAnswer"), guardianError: document.getElementById("guardianError"),
    soundButton: document.getElementById("soundButton"), toast: document.getElementById("toast"), confetti: document.getElementById("confetti")
  };
  const ctx = els.canvas.getContext("2d");

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? new Set(saved.filter(id => countries.some(c => c.id === id))) : new Set();
    } catch (_) { return new Set(); }
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.discovered])); } catch (_) { /* local saving may be unavailable */ }
  }

  function normalizeAngle(value) { return ((value + 180) % 360 + 360) % 360 - 180; }

  function project(lat, lon, radius, cx, cy) {
    const rad = Math.PI / 180;
    const phi = lat * rad;
    const lambda = normalizeAngle(lon - state.centerLon) * rad;
    const depth = Math.cos(phi) * Math.cos(lambda);
    return { x: cx + radius * Math.cos(phi) * Math.sin(lambda), y: cy - radius * Math.sin(phi), visible: depth > .03, depth };
  }

  function resizeAndDraw() {
    const rect = els.globe.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.max(1, Math.floor(rect.width));
    els.canvas.width = size * dpr;
    els.canvas.height = size * dpr;
    els.canvas.style.width = size + "px";
    els.canvas.style.height = size + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGlobe(size);
    positionMarkers(size);
  }

  function drawGlobe(size) {
    const r = size * .475, cx = size / 2, cy = size / 2;
    ctx.clearRect(0, 0, size, size);
    const ocean = ctx.createRadialGradient(size * .34, size * .28, size * .05, cx, cy, r);
    ocean.addColorStop(0, "#43c9e5"); ocean.addColorStop(.64, "#168dcc"); ocean.addColorStop(1, "#0862a8");
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = ocean; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();

    ctx.lineWidth = Math.max(1, size * .003); ctx.strokeStyle = "rgba(255,255,255,.19)";
    for (let lat = -60; lat <= 60; lat += 30) drawGeoLine(Array.from({ length: 145 }, (_, i) => [i * 2.5 - 180, lat]), r, cx, cy);
    for (let lon = -180; lon < 180; lon += 30) drawGeoLine(Array.from({ length: 73 }, (_, i) => [lon, i * 2.5 - 90]), r, cx, cy);

    landShapes.forEach((shape, index) => {
      const points = shape.map(([lon, lat]) => project(lat, lon, r, cx, cy));
      const visible = points.filter(p => p.visible);
      if (visible.length < 2) return;
      ctx.beginPath();
      visible.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      if (visible.length > 2) ctx.closePath();
      ctx.fillStyle = index % 3 === 0 ? "#8ed26d" : index % 3 === 1 ? "#a7dc72" : "#7bc56a";
      ctx.fill(); ctx.lineWidth = Math.max(1, size * .004); ctx.strokeStyle = "rgba(41,123,74,.42)"; ctx.stroke();
    });

    const shade = ctx.createLinearGradient(0, 0, size, 0);
    shade.addColorStop(0, "rgba(1,35,82,.44)"); shade.addColorStop(.32, "rgba(1,35,82,0)"); shade.addColorStop(.72, "rgba(255,255,255,.06)"); shade.addColorStop(1, "rgba(1,35,82,.34)");
    ctx.fillStyle = shade; ctx.fillRect(0, 0, size, size); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,255,255,.72)"; ctx.lineWidth = Math.max(4, size * .012); ctx.stroke();
  }

  function drawGeoLine(points, r, cx, cy) {
    let penDown = false;
    ctx.beginPath();
    points.forEach(([lon, lat]) => {
      const p = project(lat, lon, r, cx, cy);
      if (!p.visible) { penDown = false; return; }
      if (!penDown) { ctx.moveTo(p.x, p.y); penDown = true; } else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }

  function buildMarkers() {
    els.markers.innerHTML = countries.map(c => `<button type="button" class="country-marker" data-country="${c.id}" aria-label="${c.name} ${state.discovered.has(c.id) ? "다시 보기" : "발견하기"}"><span>${state.discovered.has(c.id) ? c.icon : "?"}</span></button>`).join("");
    els.markers.querySelectorAll("button").forEach(button => button.addEventListener("click", event => {
      event.stopPropagation(); openCountry(button.dataset.country);
    }));
  }

  function positionMarkers(size) {
    const r = size * .475, cx = size / 2, cy = size / 2;
    countries.forEach(c => {
      const marker = els.markers.querySelector(`[data-country="${c.id}"]`);
      if (!marker) return;
      const p = project(c.lat, c.lon, r, cx, cy);
      marker.hidden = !p.visible;
      marker.style.left = p.x + "px"; marker.style.top = p.y + "px";
      marker.style.zIndex = String(10 + Math.round(p.depth * 10));
      marker.style.opacity = String(Math.max(.5, p.depth));
      marker.style.filter = `brightness(${.82 + p.depth * .18})`;
      marker.classList.toggle("is-found", state.discovered.has(c.id));
    });
  }

  function renderProgress() {
    const count = state.discovered.size, total = countries.length;
    els.progressText.textContent = `${count} / ${total}`;
    els.collectionCount.textContent = `${count}개`;
    els.progressBar.style.width = `${count / total * 100}%`;
    if (count === total) {
      els.goalText.textContent = "세계지도 완성!";
      els.guideTitle.textContent = "와, 지도를 모두 밝혔어!";
      els.guideMessage.textContent = "도감에서 좋아하는 나라를 다시 만나 보자.";
    } else {
      const next = Math.min(total, Math.max(1, Math.ceil((count + 1) / 3) * 3));
      els.goalText.textContent = count < 1 ? "나라 1개 발견하기" : `나라 ${next}개 발견하기`;
    }
  }

  function renderCollection() {
    els.collectionGrid.innerHTML = countries.map(c => {
      const found = state.discovered.has(c.id);
      return found
        ? `<button type="button" class="country-card is-found" data-open-country="${c.id}" style="--card-color:${c.color}"><span class="card-icon" aria-hidden="true">${c.icon}</span><span class="country-card-inner"><span class="card-flag" aria-hidden="true">${c.flag}</span><h3>${c.name}</h3><p>${c.region} · ${c.place}</p></span></button>`
        : `<div class="country-card is-locked" aria-label="아직 발견하지 못한 ${c.region}의 나라"><div class="country-card-inner"><span class="mystery">?</span><h3>아직 비밀이에요</h3><p>${c.region}에서 찾아보세요</p></div></div>`;
    }).join("");
    els.collectionGrid.querySelectorAll("[data-open-country]").forEach(button => button.addEventListener("click", () => openCountry(button.dataset.openCountry)));
  }

  function openCountry(id) {
    const country = countries.find(c => c.id === id);
    if (!country) return;
    state.activeCountry = country; state.failedOptions.clear();
    state.centerLon = country.lon; resizeAndDraw();
    els.guideTitle.textContent = `${country.name}에 도착!`;
    els.guideMessage.textContent = state.discovered.has(id) ? `${country.place} 이야기를 도감에서 다시 만나 보자.` : "기억 조각 세 개를 보고 탐험 미션에 도전해 보자!";
    renderCountryIntro(country);
    els.dialog.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => els.dialog.querySelector("button")?.focus(), 30);
    if (state.soundOn) speak(`${country.name}에 도착했어요. ${country.story}`);
  }

  function renderCountryIntro(country) {
    const found = state.discovered.has(country.id);
    els.dialogContent.innerHTML = `
      <section style="--country-tint:${country.color};--country-accent:${country.accent}">
        <div class="country-hero">
          <div class="country-flag" aria-hidden="true">${country.flag}</div>
          <div><p class="eyebrow">${found ? "도감 다시 보기" : "새로운 나라 발견"}</p><h2 id="dialogTitle">${country.name}</h2><p>${country.region} · ${country.story}</p></div>
        </div>
        <div class="fact-grid">${country.facts.map(f => `<article class="fact-card"><span class="fact-icon" aria-hidden="true">${f[0]}</span><strong>${f[1]}</strong><p>${f[2]}</p></article>`).join("")}</div>
        <div class="dialog-actions">
          <button type="button" class="speak-button" id="speakCountry">🔊 이야기 듣기</button>
          <button type="button" class="primary-button" id="startMission">${found ? "도감으로 돌아가기" : "탐험 미션 시작"}</button>
        </div>
      </section>`;
    document.getElementById("speakCountry").addEventListener("click", () => speak(`${country.name}. ${country.story} ${country.facts.map(f => f[2]).join(" ")}`));
    document.getElementById("startMission").addEventListener("click", found ? closeCountryDialog : () => renderMission(country));
  }

  function renderMission(country) {
    els.dialogContent.innerHTML = `
      <section class="mission-screen">
        <div class="mission-badge">${country.mission.type}</div>
        <h2 id="dialogTitle">${country.mission.prompt}</h2>
        <p class="mission-hint" id="missionHint">천천히 보고 골라도 괜찮아요.</p>
        <div class="option-grid">${country.mission.options.map((o, i) => `<button type="button" class="option-button" data-option="${i}"><span class="option-emoji" aria-hidden="true">${o[0]}</span>${o[1]}</button>`).join("")}</div>
      </section>`;
    els.dialogContent.querySelectorAll("[data-option]").forEach(button => button.addEventListener("click", () => answerMission(country, Number(button.dataset.option), button)));
  }

  function answerMission(country, choice, button) {
    if (choice === country.mission.answer) {
      state.discovered.add(country.id); saveProgress(); buildMarkers(); renderProgress(); renderCollection(); showSuccess(country); launchConfetti();
      if (state.soundOn) speak(`정답이에요! ${country.name}을 발견했어요.`);
    } else {
      state.failedOptions.add(choice); button.classList.add("is-wrong"); button.disabled = true;
      document.getElementById("missionHint").textContent = `괜찮아요! 힌트: ${country.mission.hint}`;
      if (navigator.vibrate) navigator.vibrate(60);
    }
  }

  function showSuccess(country) {
    els.dialogContent.innerHTML = `<section class="success-screen"><div class="success-burst" aria-hidden="true">${country.icon}</div><p class="eyebrow">도감 카드가 열렸어요!</p><h2 id="dialogTitle">${country.name} 발견!</h2><p>${country.name}의 물음표가 ${country.icon} 표시로 바뀌었어요.</p><button type="button" class="primary-button" id="continueExplore">다음 나라 찾기</button></section>`;
    document.getElementById("continueExplore").addEventListener("click", closeCountryDialog);
  }

  function closeCountryDialog() {
    els.dialog.hidden = true; document.body.style.overflow = "";
    els.guideTitle.textContent = state.discovered.size === countries.length ? "세계지도 완성!" : "다음에는 어디로 갈까?";
    els.guideMessage.textContent = state.discovered.size === countries.length ? "도감에서 모든 나라 이야기를 다시 볼 수 있어." : "지구본을 다시 돌려 또 다른 물음표를 찾아보자!";
  }

  function setView(view) {
    state.view = view;
    document.getElementById("exploreView").hidden = view !== "explore";
    document.getElementById("collectionView").hidden = view !== "collection";
    document.querySelectorAll(".view-tab").forEach(tab => {
      const active = tab.dataset.view === view; tab.classList.toggle("is-active", active); tab.setAttribute("aria-selected", String(active));
    });
    if (view === "explore") requestAnimationFrame(resizeAndDraw);
  }

  function rotateBy(degrees) {
    state.centerLon = normalizeAngle(state.centerLon + degrees); resizeAndDraw();
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) { showToast("이 기기에서는 읽어주기를 사용할 수 없어요."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "ko-KR"; utterance.rate = .88; utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
  }

  let toastTimer;
  function showToast(message) {
    window.clearTimeout(toastTimer); els.toast.textContent = message; els.toast.hidden = false;
    toastTimer = window.setTimeout(() => { els.toast.hidden = true; }, 2300);
  }

  function launchConfetti() {
    const colors = ["#ffd34e", "#ff8a3d", "#4fd1c5", "#5876e8", "#ff6b67"];
    els.confetti.innerHTML = Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 29) % 100}%;background:${colors[i % colors.length]};--drift:${(i % 2 ? 1 : -1) * (25 + i % 55)}px;animation-delay:${(i % 9) * .045}s"></i>`).join("");
    window.setTimeout(() => { els.confetti.innerHTML = ""; }, 2200);
  }

  function setupGlobeDrag() {
    els.globe.addEventListener("pointerdown", event => {
      if (event.target.closest("button")) return;
      state.dragging = true; state.dragStartX = event.clientX; state.dragStartLon = state.centerLon;
      els.globe.setPointerCapture(event.pointerId);
    });
    els.globe.addEventListener("pointermove", event => {
      if (!state.dragging) return;
      const width = els.globe.clientWidth || 1;
      state.centerLon = normalizeAngle(state.dragStartLon - (event.clientX - state.dragStartX) / width * 210);
      resizeAndDraw();
    });
    const stop = () => { state.dragging = false; };
    els.globe.addEventListener("pointerup", stop); els.globe.addEventListener("pointercancel", stop);
  }

  function setupKidSafeGuards() {
    const isAdultControl = target => target instanceof Element && Boolean(target.closest("[data-adult-control], input, textarea, [contenteditable='true']"));
    document.addEventListener("gesturestart", event => event.preventDefault(), { passive: false });
    document.addEventListener("gesturechange", event => event.preventDefault(), { passive: false });
    document.addEventListener("gestureend", event => event.preventDefault(), { passive: false });
    document.addEventListener("touchstart", event => { if (event.touches.length > 1) event.preventDefault(); }, { passive: false });
    document.addEventListener("touchmove", event => { if (event.touches.length > 1) event.preventDefault(); }, { passive: false });
    document.addEventListener("contextmenu", event => { if (!isAdultControl(event.target)) event.preventDefault(); });
    document.addEventListener("selectstart", event => { if (!isAdultControl(event.target)) event.preventDefault(); });
    document.addEventListener("dragstart", event => { if (!isAdultControl(event.target)) event.preventDefault(); });
    ["copy", "cut", "paste"].forEach(type => document.addEventListener(type, event => { if (!isAdultControl(event.target)) event.preventDefault(); }));
  }

  function bindEvents() {
    window.addEventListener("resize", resizeAndDraw);
    document.getElementById("rotateLeft").addEventListener("click", () => rotateBy(-35));
    document.getElementById("rotateRight").addEventListener("click", () => rotateBy(35));
    document.querySelectorAll(".view-tab").forEach(tab => tab.addEventListener("click", () => setView(tab.dataset.view)));
    document.getElementById("closeDialog").addEventListener("click", closeCountryDialog);
    els.dialog.addEventListener("click", event => { if (event.target === els.dialog) closeCountryDialog(); });
    document.getElementById("guardianButton").addEventListener("click", () => {
      els.guardianAnswer.value = ""; els.guardianError.textContent = ""; els.guardianDialog.hidden = false; document.body.style.overflow = "hidden";
      setTimeout(() => els.guardianAnswer.focus(), 30);
    });
    document.getElementById("closeGuardian").addEventListener("click", closeGuardian);
    els.guardianDialog.addEventListener("click", event => { if (event.target === els.guardianDialog) closeGuardian(); });
    document.getElementById("resetProgress").addEventListener("click", () => {
      if (els.guardianAnswer.value.trim() !== "13") { els.guardianError.textContent = "계산 결과를 다시 확인해 주세요."; return; }
      state.discovered.clear(); saveProgress(); buildMarkers(); renderProgress(); renderCollection(); closeGuardian(); setView("explore"); showToast("탐험 기록을 처음으로 돌렸어요.");
    });
    els.soundButton.addEventListener("click", () => {
      state.soundOn = !state.soundOn; els.soundButton.textContent = state.soundOn ? "🔊" : "🔇"; els.soundButton.setAttribute("aria-pressed", String(state.soundOn)); els.soundButton.setAttribute("aria-label", state.soundOn ? "소리 끄기" : "소리 켜기");
      if (state.soundOn) speak("소리를 켰어요."); else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    });
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if (!els.guardianDialog.hidden) closeGuardian(); else if (!els.dialog.hidden) closeCountryDialog();
    });
  }

  function closeGuardian() { els.guardianDialog.hidden = true; document.body.style.overflow = ""; }

  function setupMascot() {
    const image = document.getElementById("mascotImage"), fallback = document.getElementById("mascotFallback");
    image.addEventListener("load", () => { image.hidden = false; fallback.hidden = true; });
    image.addEventListener("error", () => { image.hidden = true; fallback.hidden = false; });
    if (image.complete && image.naturalWidth) { image.hidden = false; fallback.hidden = true; }
  }

  setupKidSafeGuards(); setupGlobeDrag(); bindEvents(); setupMascot(); buildMarkers(); renderProgress(); renderCollection();
  requestAnimationFrame(resizeAndDraw);
})();
