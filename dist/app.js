(function () {
  "use strict";

  const STORAGE_KEY = "world-explorer-progress-v1";
  const countries = [
    {
      id: "kr", iso: "KOR", name: "대한민국", region: "아시아", lat: 36.2, lon: 127.8, flag: "🇰🇷", icon: "🐯", color: "#ffd7bf", accent: "#ea6f32",
      hello: "안녕하세요!", place: "한라산과 서울", story: "산과 바다, 오래된 궁궐과 새로운 도시가 어우러진 나라예요.",
      facts: [["🙇", "인사", "고개를 살짝 숙이며 ‘안녕하세요’라고 인사해요."], ["🌸", "자연", "봄에는 분홍빛 벚꽃이 활짝 피어요."], ["🥁", "문화", "흥겨운 장단에 맞춰 탈춤을 추기도 해요."]],
      mission: { type: "소리 탐정", prompt: "대한민국에서 만난 친구에게 어떻게 인사할까?", options: [["🙇", "안녕하세요"], ["👋", "봉주르"], ["🤠", "헬로"]], answer: 0, hint: "다섯 글자로 말하는 인사예요." }
    },
    {
      id: "jp", iso: "JPN", name: "일본", region: "아시아", lat: 37.1, lon: 138.2, flag: "🇯🇵", icon: "🌸", color: "#ffdfe7", accent: "#e85f7a",
      hello: "곤니치와!", place: "후지산", story: "길고 좁은 여러 섬이 이어진 나라예요.",
      facts: [["🙇", "인사", "‘곤니치와’라고 말하며 인사해요."], ["🗻", "자연", "높고 아름다운 후지산이 있어요."], ["🌸", "계절", "봄이면 벚꽃이 활짝 피어요."]],
      mission: { type: "관찰 탐정", prompt: "일본에서 볼 수 있는 높고 하얀 산은 무엇일까?", options: [["🗻", "후지산"], ["🏜️", "사하라 사막"], ["🗿", "모아이 석상"]], answer: 0, hint: "눈이 덮인 산 그림을 찾아보세요." }
    },
    {
      id: "cn", iso: "CHN", name: "중국", region: "아시아", lat: 35.8, lon: 103.8, flag: "🇨🇳", icon: "🐼", color: "#ffdba9", accent: "#d54a36",
      hello: "니하오!", place: "만리장성", story: "넓은 땅에 사막, 높은 산, 큰 도시를 모두 만날 수 있어요.",
      facts: [["👋", "인사", "‘니하오’라고 반갑게 인사해요."], ["🐼", "동물", "대나무를 좋아하는 판다가 살아요."], ["🏯", "건축", "아주 긴 만리장성이 이어져 있어요."]],
      mission: { type: "동물 친구", prompt: "중국의 대나무 숲에서 만날 수 있는 동물은?", options: [["🦘", "캥거루"], ["🐼", "판다"], ["🦁", "사자"]], answer: 1, hint: "검은색과 흰색 털을 가진 동물이에요." }
    },
    {
      id: "in", iso: "IND", name: "인도", region: "아시아", lat: 22.6, lon: 78.9, flag: "🇮🇳", icon: "🕌", color: "#ffe7a8", accent: "#e18a25",
      hello: "나마스테!", place: "타지마할", story: "다양한 말과 음식, 음악이 가득한 큰 나라예요.",
      facts: [["🙏", "인사", "두 손을 모아 ‘나마스테’라고 인사해요."], ["🕌", "건축", "하얀 대리석으로 지은 타지마할이 있어요."], ["🪷", "자연", "연꽃은 인도를 상징하는 꽃이에요."]],
      mission: { type: "몸짓 따라하기", prompt: "‘나마스테’ 인사와 어울리는 모습은?", options: [["🙏", "두 손 모으기"], ["🙈", "눈 가리기"], ["🦶", "발 구르기"]], answer: 0, hint: "양손을 가슴 앞에 모아 보세요." }
    },
    {
      id: "eg", iso: "EGY", name: "이집트", region: "아프리카", lat: 26.8, lon: 30.8, flag: "🇪🇬", icon: "🏺", color: "#ffe1a1", accent: "#bd7220",
      hello: "아흘란!", place: "피라미드", story: "오래된 피라미드와 넓은 사막을 만날 수 있는 나라예요.",
      facts: [["🏜️", "자연", "국토의 많은 부분이 사막이에요."], ["🔺", "건축", "아주 오래된 피라미드가 있어요."], ["🌊", "강", "나일강 주변에는 초록 식물이 자라요."]],
      mission: { type: "여행 가방", prompt: "뜨거운 사막 여행에서 꼭 챙기면 좋은 것은?", options: [["🧣", "두꺼운 목도리"], ["💧", "물과 햇빛 가리개"], ["⛸️", "스케이트"]], answer: 1, hint: "햇빛이 강하고 물이 귀한 곳이에요." }
    },
    {
      id: "ke", iso: "KEN", name: "케냐", region: "아프리카", lat: 0.2, lon: 37.9, flag: "🇰🇪", icon: "🦒", color: "#dff0b4", accent: "#5b9345",
      hello: "잠보!", place: "사바나", story: "넓은 초원에서 다양한 야생동물을 만날 수 있어요.",
      facts: [["👋", "인사", "스와힐리어로 ‘잠보’라고 인사해요."], ["🦒", "동물", "기린과 코끼리가 초원을 걸어요."], ["⛰️", "자연", "눈 덮인 케냐산도 볼 수 있어요."]],
      mission: { type: "서식지 찾기", prompt: "케냐의 사바나에서 만날 수 있는 동물은?", options: [["🐧", "펭귄"], ["🦒", "기린"], ["🐼", "판다"]], answer: 1, hint: "목이 길어서 높은 나뭇잎도 먹을 수 있어요." }
    },
    {
      id: "fr", iso: "FRA", name: "프랑스", region: "유럽", lat: 46.4, lon: 2.2, flag: "🇫🇷", icon: "🗼", color: "#dce7ff", accent: "#526ac7",
      hello: "봉주르!", place: "에펠탑", story: "예술과 건축, 여러 지역의 맛있는 음식으로 알려진 나라예요.",
      facts: [["👋", "인사", "‘봉주르’라고 인사해요."], ["🗼", "건축", "파리에는 철로 만든 에펠탑이 있어요."], ["🎨", "예술", "많은 미술관에서 멋진 작품을 만나요."]],
      mission: { type: "그림자 찾기", prompt: "프랑스 파리의 유명한 탑은 무엇일까?", options: [["🗼", "에펠탑"], ["🗿", "모아이 석상"], ["🕌", "타지마할"]], answer: 0, hint: "철로 만든 아주 높은 탑이에요." }
    },
    {
      id: "it", iso: "ITA", name: "이탈리아", region: "유럽", lat: 42.8, lon: 12.5, flag: "🇮🇹", icon: "🍕", color: "#daf0d8", accent: "#4a9560",
      hello: "차오!", place: "콜로세움", story: "오래된 도시와 예술 작품이 많이 남아 있는 나라예요.",
      facts: [["👋", "인사", "‘차오’는 만날 때도 헤어질 때도 써요."], ["🏛️", "건축", "로마에는 둥근 콜로세움이 있어요."], ["🌋", "자연", "지금도 활동하는 화산이 있어요."]],
      mission: { type: "모양 탐정", prompt: "세계지도에서 이탈리아는 무엇처럼 보일까?", options: [["👢", "긴 장화"], ["🎩", "둥근 모자"], ["🧤", "손장갑"]], answer: 0, hint: "발에 신는 물건을 떠올려 보세요." }
    },
    {
      id: "gb", iso: "GBR", name: "영국", region: "유럽", lat: 55.1, lon: -3.4, flag: "🇬🇧", icon: "🏰", color: "#e5e0ff", accent: "#6657bd",
      hello: "헬로!", place: "빅벤", story: "오래된 성과 현대적인 도시가 함께 있는 섬나라예요.",
      facts: [["👋", "인사", "영어로 ‘헬로’라고 인사해요."], ["🕰️", "건축", "런던의 큰 시계 종을 빅벤이라고 불러요."], ["🌦️", "날씨", "구름과 비를 자주 만날 수 있어요."]],
      mission: { type: "시간 탐정", prompt: "영국 런던의 커다란 시계 종은?", options: [["🕰️", "빅벤"], ["🔺", "피라미드"], ["🗼", "에펠탑"]], answer: 0, hint: "시간을 알려 주는 건축물이에요." }
    },
    {
      id: "us", iso: "USA", name: "미국", region: "아메리카", lat: 39.3, lon: -98.6, flag: "🇺🇸", icon: "🦅", color: "#ffdddc", accent: "#c94e5b",
      hello: "헬로!", place: "그랜드캐니언", story: "넓은 땅에 사막, 큰 강, 높은 산과 도시가 모두 있어요.",
      facts: [["🦅", "동물", "흰머리수리는 미국을 상징해요."], ["🏞️", "자연", "그랜드캐니언은 아주 크고 깊어요."], ["🚀", "과학", "우주 탐사를 오랫동안 연구했어요."]],
      mission: { type: "자연 탐정", prompt: "미국의 붉고 거대한 협곡은 무엇일까?", options: [["🏞️", "그랜드캐니언"], ["🌊", "아마존강"], ["🗻", "후지산"]], answer: 0, hint: "강물이 아주 오랜 시간 깎아 만든 골짜기예요." }
    },
    {
      id: "br", iso: "BRA", name: "브라질", region: "아메리카", lat: -10.7, lon: -52.9, flag: "🇧🇷", icon: "🦜", color: "#d8f1ce", accent: "#398e51",
      hello: "올라!", place: "아마존 열대우림", story: "남아메리카에서 가장 넓은 나라예요.",
      facts: [["👋", "인사", "포르투갈어로 ‘올라’라고 인사해요."], ["🌳", "자연", "아마존 열대우림에는 큰 나무가 가득해요."], ["🦜", "동물", "화려한 깃털의 새들이 살아요."]],
      mission: { type: "숲속 탐험", prompt: "브라질의 아마존 열대우림과 어울리는 모습은?", options: [["🌳", "울창한 숲"], ["🧊", "얼음 벌판"], ["🏜️", "모래 사막"]], answer: 0, hint: "비가 많이 내리고 나무가 빽빽하게 자라요." }
    },
    {
      id: "au", iso: "AUS", name: "호주", region: "오세아니아", lat: -25.3, lon: 134.4, flag: "🇦🇺", icon: "🦘", color: "#d3eeed", accent: "#249293",
      hello: "그데이!", place: "그레이트배리어리프", story: "하나의 나라가 대륙 대부분을 차지하고 있어요.",
      facts: [["🦘", "동물", "캥거루는 큰 뒷다리로 껑충 뛰어요."], ["🐠", "바다", "거대한 산호초에 많은 생물이 살아요."], ["👋", "인사", "친근하게 ‘그데이’라고 인사하기도 해요."]],
      mission: { type: "동물 친구", prompt: "호주에서 처음 자라난 대표 동물은?", options: [["🐼", "판다"], ["🦘", "캥거루"], ["🦒", "기린"]], answer: 1, hint: "주머니가 있고 껑충껑충 뛰는 동물이에요." }
    }
  ];

  const regionColors = { 아시아: "#efae42", 유럽: "#7183dc", 아프리카: "#63a95d", 아메리카: "#d96a69", 오세아니아: "#34a6a4", 남극: "#d4e8ea" };
  const state = { discovered: loadProgress(), activeCountry: null, soundOn: false, view: "explore", globe: null, geojson: null, resizeObserver: null };
  const els = {
    globeWrap: document.getElementById("globeWrap"), globeCanvas: document.getElementById("globeCanvas"), globeLoading: document.getElementById("globeLoading"), globeError: document.getElementById("globeError"),
    progressText: document.getElementById("progressText"), progressBar: document.getElementById("progressBar"), goalText: document.getElementById("goalText"), guideTitle: document.getElementById("guideTitle"), guideMessage: document.getElementById("guideMessage"),
    collectionCount: document.getElementById("collectionCount"), collectionGrid: document.getElementById("collectionGrid"), dialog: document.getElementById("countryDialog"), dialogContent: document.getElementById("dialogContent"),
    guardianDialog: document.getElementById("guardianDialog"), guardianAnswer: document.getElementById("guardianAnswer"), guardianError: document.getElementById("guardianError"), soundButton: document.getElementById("soundButton"), toast: document.getElementById("toast"), confetti: document.getElementById("confetti")
  };

  function loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? new Set(saved.filter(id => countries.some(country => country.id === id))) : new Set();
    } catch (_) { return new Set(); }
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

  function polygonColor(feature) {
    const target = targetForFeature(feature);
    if (target) return state.discovered.has(target.id) ? target.accent : "#9da6a2";
    const continent = feature.properties && feature.properties.CONTINENT;
    const names = { Asia: "아시아", Europe: "유럽", Africa: "아프리카", "North America": "아메리카", "South America": "아메리카", Oceania: "오세아니아", Antarctica: "남극" };
    return regionColors[names[continent]] || "#a9b981";
  }

  function makePin(country) {
    const button = document.createElement("button");
    const found = state.discovered.has(country.id);
    button.type = "button";
    button.className = `country-flag-marker ${found ? "is-found" : "is-locked"}`;
    button.dataset.country = country.id;
    button.setAttribute("aria-label", `${country.name}, ${found ? "도감 열림, 다시 보기" : "도감 잠김, 퀴즈 풀기"}`);
    button.innerHTML = `<span class="flag-cloth" aria-hidden="true"><img src="${flagAsset(country)}" alt="" draggable="false" /></span><span class="flag-status" aria-hidden="true">${found ? "✓" : "?"}</span>`;
    button.addEventListener("click", event => { event.stopPropagation(); openCountry(country.id); });
    return button;
  }

  function sizeGlobe() {
    if (!state.globe) return;
    const rect = els.globeWrap.getBoundingClientRect();
    const size = Math.max(280, Math.floor(Math.min(rect.width, rect.height || rect.width)));
    state.globe.width(size).height(size);
  }

  async function initGlobe() {
    els.globeError.hidden = true;
    els.globeLoading.hidden = false;
    try {
      if (typeof window.Globe !== "function") throw new Error("Globe.GL을 찾을 수 없습니다.");
      const response = await fetch("./data/countries.geojson");
      if (!response.ok) throw new Error("지도 데이터를 불러오지 못했습니다.");
      state.geojson = await response.json();
      els.globeCanvas.innerHTML = "";
      state.globe = new window.Globe(els.globeCanvas, { animateIn: true, rendererConfig: { antialias: true, alpha: true } })
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("./assets/ocean-paper-texture.png")
        .showAtmosphere(true)
        .atmosphereColor("#83ddf2")
        .atmosphereAltitude(0.15)
        .showGraticules(false)
        .polygonsData(state.geojson.features)
        .polygonCapColor(polygonColor)
        .polygonSideColor(() => "rgba(35,69,55,.55)")
        .polygonStrokeColor(feature => {
          const target = targetForFeature(feature);
          return target && !state.discovered.has(target.id) ? "rgba(225,231,226,.92)" : "rgba(255,248,210,.78)";
        })
        .polygonAltitude(feature => {
          const target = targetForFeature(feature);
          return target ? (state.discovered.has(target.id) ? 0.026 : 0.014) : 0.007;
        })
        .polygonLabel(feature => {
          const target = targetForFeature(feature);
          return target ? `<b style="display:flex;align-items:center;gap:7px;font-size:16px"><img src="${flagAsset(target)}" alt="" style="width:28px;border-radius:3px">${target.name}</b><br>${state.discovered.has(target.id) ? "✓ 도감이 열렸어요" : "? 아직 잠긴 나라예요"}` : "";
        })
        .onPolygonClick(feature => {
          const target = targetForFeature(feature);
          if (target) openCountry(target.id);
          else showToast("회색 국기가 있는 나라부터 탐험해 보자!");
        })
        .htmlElementsData(countries)
        .htmlLat("lat")
        .htmlLng("lon")
        .htmlAltitude(0.045)
        .htmlElement(makePin)
        .htmlTransitionDuration(0);

      sizeGlobe();
      state.globe.pointOfView({ lat: 20, lng: 105, altitude: 1.62 }, 0);
      const controls = state.globe.controls();
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = false;
      if (state.globe.renderer) state.globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      state.resizeObserver = new ResizeObserver(sizeGlobe);
      state.resizeObserver.observe(els.globeWrap);
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
      .polygonStrokeColor(feature => {
        const target = targetForFeature(feature);
        return target && !state.discovered.has(target.id) ? "rgba(225,231,226,.92)" : "rgba(255,248,210,.78)";
      })
      .polygonAltitude(feature => {
        const target = targetForFeature(feature);
        return target ? (state.discovered.has(target.id) ? 0.026 : 0.014) : 0.007;
      })
      .polygonsData([...state.geojson.features]);
    state.globe.htmlElementsData([]).htmlElementsData(countries).htmlElement(makePin);
  }

  function rotateBy(degrees) {
    if (!state.globe) return;
    const view = state.globe.pointOfView();
    state.globe.pointOfView({ lat: view.lat, lng: view.lng + degrees, altitude: view.altitude }, 550);
  }

  function flyTo(country) {
    if (state.globe) state.globe.pointOfView({ lat: country.lat, lng: country.lon, altitude: 1.45 }, 750);
  }

  function renderProgress() {
    const count = state.discovered.size;
    const total = countries.length;
    els.progressText.textContent = `${count} / ${total}`;
    els.collectionCount.textContent = `${count} / ${total}`;
    els.progressBar.style.width = `${count / total * 100}%`;
    if (count === total) {
      els.goalText.textContent = "세계도감 완성!";
      els.guideTitle.textContent = "와, 지도를 모두 밝혔어!";
      els.guideMessage.textContent = "도감에서 좋아하는 나라를 다시 만나 보자.";
    } else {
      const next = count < 1 ? 1 : Math.min(total, Math.ceil((count + 1) / 3) * 3);
      els.goalText.textContent = `나라 ${next}개 발견하기`;
    }
  }

  function renderCollection() {
    els.collectionGrid.innerHTML = countries.map(country => {
      const found = state.discovered.has(country.id);
      if (found) {
        return `<button type="button" class="country-card is-found" data-open-country="${country.id}" style="--card-color:${country.color}"><span class="card-icon" aria-hidden="true">${country.icon}</span><span class="country-card-inner"><span class="card-flag" aria-hidden="true"><img src="${flagAsset(country)}" alt="" /></span><h3>${country.name}</h3><p>${country.region} · ${country.place}</p></span></button>`;
      }
      return `<div class="country-card is-locked" aria-label="아직 발견하지 못한 ${country.region}의 나라"><div class="country-card-inner"><span class="mystery">?</span><h3>${country.region}의 비밀</h3><p>지구본에서 찾아보세요.</p></div></div>`;
    }).join("");
    els.collectionGrid.querySelectorAll("[data-open-country]").forEach(button => button.addEventListener("click", () => openCountry(button.dataset.openCountry)));
  }

  function openCountry(id) {
    const country = countries.find(item => item.id === id);
    if (!country) return;
    state.activeCountry = country;
    flyTo(country);
    els.guideTitle.textContent = `${country.name}에 도착!`;
    els.guideMessage.textContent = state.discovered.has(id) ? `${country.place} 이야기를 도감에서 다시 만나 보자.` : "기억 조각 세 개를 보고 탐험 미션에 도전해 보자!";
    renderCountryIntro(country);
    els.dialog.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => els.dialog.querySelector("button")?.focus(), 40);
    if (state.soundOn) speak(`${country.name}에 도착했어요. ${country.story}`);
  }

  function renderCountryIntro(country) {
    const found = state.discovered.has(country.id);
    els.dialogContent.innerHTML = `
      <section style="--country-tint:${country.color};--country-accent:${country.accent}">
        <div class="country-hero">
          <div class="country-flag" aria-hidden="true"><img src="${flagAsset(country)}" alt="" /></div>
          <div><p class="eyebrow">${found ? "도감 다시 보기" : "새로운 나라 발견"}</p><h2 id="dialogTitle">${country.name}</h2><p>${country.region} · ${country.story}</p></div>
        </div>
        <div class="fact-grid">${country.facts.map(fact => `<article class="fact-card"><span class="fact-icon" aria-hidden="true">${fact[0]}</span><strong>${fact[1]}</strong><p>${fact[2]}</p></article>`).join("")}</div>
        <div class="dialog-actions">
          <button type="button" class="speak-button" id="speakCountry">🔊 이야기 듣기</button>
          <button type="button" class="primary-button" id="startMission">${found ? "도감으로 돌아가기" : "탐험 미션 시작"}</button>
        </div>
      </section>`;
    document.getElementById("speakCountry").addEventListener("click", () => speak(`${country.name}. ${country.story} ${country.facts.map(fact => fact[2]).join(" ")}`));
    document.getElementById("startMission").addEventListener("click", found ? closeCountryDialog : () => renderMission(country));
  }

  function renderMission(country) {
    els.dialogContent.innerHTML = `
      <section class="mission-screen">
        <div class="mission-badge">${country.mission.type}</div>
        <h2 id="dialogTitle">${country.mission.prompt}</h2>
        <p class="mission-hint" id="missionHint">천천히 보고 골라도 괜찮아요.</p>
        <div class="option-grid">${country.mission.options.map((option, index) => `<button type="button" class="option-button" data-option="${index}"><span class="option-emoji" aria-hidden="true">${option[0]}</span>${option[1]}</button>`).join("")}</div>
      </section>`;
    els.dialogContent.querySelectorAll("[data-option]").forEach(button => button.addEventListener("click", () => answerMission(country, Number(button.dataset.option), button)));
  }

  function answerMission(country, choice, button) {
    if (choice === country.mission.answer) {
      state.discovered.add(country.id);
      saveProgress();
      refreshGlobe();
      renderProgress();
      renderCollection();
      showSuccess(country);
      launchConfetti();
      if (state.soundOn) speak(`정답이에요! ${country.name}을 발견했어요.`);
    } else {
      button.classList.add("is-wrong");
      button.disabled = true;
      document.getElementById("missionHint").textContent = `괜찮아요! 힌트: ${country.mission.hint}`;
      if (navigator.vibrate) navigator.vibrate(60);
    }
  }

  function showSuccess(country) {
    els.dialogContent.innerHTML = `<section class="success-screen"><div class="success-burst" aria-hidden="true">${country.icon}</div><p class="eyebrow">도감 스티커가 열렸어요!</p><h2 id="dialogTitle">${country.name} 발견!</h2><p>회색이던 ${country.name} 영토와 국기가 선명한 색으로 깨어났어요.</p><button type="button" class="primary-button" id="continueExplore">다음 나라 찾기</button></section>`;
    document.getElementById("continueExplore").addEventListener("click", closeCountryDialog);
  }

  function closeCountryDialog() {
    els.dialog.hidden = true;
    document.body.style.overflow = "";
    els.guideTitle.textContent = state.discovered.size === countries.length ? "세계지도 완성!" : "다음에는 어디로 갈까?";
    els.guideMessage.textContent = state.discovered.size === countries.length ? "도감에서 모든 나라 이야기를 다시 볼 수 있어." : "지구본을 다시 돌려 또 다른 회색 국기를 찾아보자!";
  }

  function setView(view) {
    state.view = view;
    document.getElementById("exploreView").hidden = view !== "explore";
    document.getElementById("collectionView").hidden = view !== "collection";
    document.querySelectorAll(".view-tab").forEach(tab => {
      const active = tab.dataset.view === view;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    if (view === "explore") window.setTimeout(() => { sizeGlobe(); if (state.globe) state.globe.resumeAnimation(); }, 30);
    else if (state.globe) state.globe.pauseAnimation();
    window.scrollTo(0, 0);
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) { showToast("이 기기에서는 읽어주기를 사용할 수 없어요."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.88;
    utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
  }

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

  function closeGuardian() { els.guardianDialog.hidden = true; document.body.style.overflow = ""; }

  function bindEvents() {
    document.getElementById("rotateLeft").addEventListener("click", () => rotateBy(-35));
    document.getElementById("rotateRight").addEventListener("click", () => rotateBy(35));
    document.getElementById("retryGlobe").addEventListener("click", initGlobe);
    document.querySelectorAll(".view-tab").forEach(tab => tab.addEventListener("click", () => setView(tab.dataset.view)));
    document.getElementById("closeDialog").addEventListener("click", closeCountryDialog);
    els.dialog.addEventListener("click", event => { if (event.target === els.dialog) closeCountryDialog(); });
    document.getElementById("guardianButton").addEventListener("click", () => {
      els.guardianAnswer.value = "";
      els.guardianError.textContent = "";
      els.guardianDialog.hidden = false;
      document.body.style.overflow = "hidden";
      window.setTimeout(() => els.guardianAnswer.focus(), 40);
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
    els.soundButton.addEventListener("click", () => {
      state.soundOn = !state.soundOn;
      els.soundButton.textContent = state.soundOn ? "🔊" : "🔇";
      els.soundButton.setAttribute("aria-pressed", String(state.soundOn));
      els.soundButton.setAttribute("aria-label", state.soundOn ? "소리 끄기" : "소리 켜기");
      if (state.soundOn) speak("소리를 켰어요."); else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    });
    document.addEventListener("visibilitychange", () => {
      if (!state.globe) return;
      if (document.hidden) state.globe.pauseAnimation();
      else if (state.view === "explore") state.globe.resumeAnimation();
    });
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if (!els.guardianDialog.hidden) closeGuardian();
      else if (!els.dialog.hidden) closeCountryDialog();
    });
  }

  function setupMascot() {
    const image = document.getElementById("mascotImage");
    const fallback = document.getElementById("mascotFallback");
    image.addEventListener("load", () => { image.hidden = false; fallback.hidden = true; });
    image.addEventListener("error", () => { image.hidden = true; fallback.hidden = false; });
    if (image.complete && image.naturalWidth) { image.hidden = false; fallback.hidden = true; }
  }

  setupKidSafeGuards();
  bindEvents();
  setupMascot();
  renderProgress();
  renderCollection();
  initGlobe();
})();
