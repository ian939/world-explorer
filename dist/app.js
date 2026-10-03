(function () {
  "use strict";

  const STORAGE_KEY = "world-explorer-progress-v2";
  const countries = [
    {
      id: "kr", iso: "KOR", name: "대한민국", region: "아시아", lat: 36.2, lon: 127.8, flag: "🇰🇷", icon: "🐯", color: "#ffd7bf", accent: "#ea6f32",
      hello: "안녕하세요!", place: "서울 · 한라산 · 한글", story: "아시아 동쪽, 한반도 남쪽에 있는 나라예요. 산이 많고 동쪽·서쪽·남쪽이 바다와 만나요.",
      quickFacts: [["수도", "서울"], ["말과 글", "한국어 · 한글"], ["가장 높은 산", "한라산 1,947m"]],
      chapters: [
        { icon: "🧭", title: "어디에 있을까?", summary: "아시아 동쪽 한반도의 남쪽에 있어요.", details: ["동쪽에는 동해, 서쪽에는 서해, 남쪽에는 남해가 있어요.", "북쪽으로는 북한과 이어져 있어요."] },
        { icon: "🏙️", title: "수도 서울", summary: "서울에는 옛 궁궐과 높은 건물이 함께 있어요.", details: ["한강이 도시 한가운데를 흘러요.", "경복궁 같은 조선 시대 궁궐을 만날 수 있어요."] },
        { icon: "🔤", title: "우리 글자 한글", summary: "한글은 세종대왕이 백성이 쉽게 읽고 쓰도록 만든 글자예요.", details: ["기본 자음 14자와 모음 10자를 조합해 글자를 만들어요.", "‘안녕하세요’는 반갑고 공손한 인사예요."] },
        { icon: "🌦️", title: "자연과 네 계절", summary: "봄·여름·가을·겨울의 모습이 뚜렷해요.", details: ["제주도의 한라산은 대한민국에서 가장 높은 산이에요.", "무궁화와 호랑이는 대한민국을 떠올리게 하는 상징이에요."] }
      ],
      remember: "대한민국 = 한반도 남쪽 · 수도 서울 · 우리 글자 한글",
      missions: [
        { type: "지도 탐정", prompt: "대한민국이 자리한 곳은 어디일까?", options: [["🧭", "아시아 동쪽의 한반도"], ["🏜️", "아프리카 북쪽의 사막"], ["🧊", "남극의 얼음 대륙"]], answer: 0, hint: "중국과 일본 사이를 살펴보세요.", explain: "맞아요. 대한민국은 아시아 동쪽, 한반도의 남쪽에 있어요." },
        { type: "도시 탐정", prompt: "대한민국의 수도는 어디일까?", options: [["🏙️", "서울"], ["🗼", "도쿄"], ["🏯", "교토"]], answer: 0, hint: "한강이 흐르고 경복궁이 있는 도시예요.", explain: "서울은 대한민국의 수도예요. 한강과 여러 옛 궁궐을 만날 수 있어요." },
        { type: "글자 탐정", prompt: "세종대왕이 백성을 위해 만든 글자는?", options: [["🔤", "한글"], ["🔢", "숫자"], ["🎵", "악보"]], answer: 0, hint: "지금 이 문제를 읽을 때 사용하는 글자예요.", explain: "한글은 자음과 모음을 모아 소리를 나타내는 우리 글자예요." }
      ]
    },
    {
      id: "jp", iso: "JPN", name: "일본", region: "아시아", lat: 37.1, lon: 138.2, flag: "🇯🇵", icon: "🌸", color: "#ffdfe7", accent: "#e85f7a",
      hello: "곤니치와!", place: "도쿄 · 후지산 · 네 개의 큰 섬", story: "대한민국의 동쪽 바다 건너에 있는 섬나라예요. 네 개의 큰 섬과 수많은 작은 섬이 길게 이어져 있어요.",
      quickFacts: [["수도", "도쿄"], ["말과 글", "일본어"], ["가장 높은 산", "후지산 3,776m"]],
      chapters: [
        { icon: "🏝️", title: "섬으로 된 나라", summary: "홋카이도·혼슈·시코쿠·규슈, 네 개의 큰 섬이 있어요.", details: ["혼슈는 네 섬 가운데 가장 크고 도쿄도 이곳에 있어요.", "남북으로 길어서 지역마다 날씨가 달라요."] },
        { icon: "🏙️", title: "수도 도쿄", summary: "도쿄는 사람이 많이 모여 사는 큰 도시예요.", details: ["높은 건물과 오래된 신사·절을 함께 볼 수 있어요.", "빠른 열차인 신칸센이 여러 도시를 이어 줘요."] },
        { icon: "🗻", title: "후지산과 자연", summary: "후지산은 높이 3,776m인 일본에서 가장 높은 산이에요.", details: ["일본에는 화산과 온천이 많아요.", "봄에는 여러 지역에서 벚꽃을 즐겨요."] },
        { icon: "✍️", title: "말과 글", summary: "‘곤니치와’는 낮에 만난 사람에게 하는 인사예요.", details: ["히라가나·가타카나·한자를 함께 사용해요.", "식사 전에는 감사의 뜻을 담아 ‘이타다키마스’라고 말하기도 해요."] }
      ],
      remember: "일본 = 대한민국 동쪽의 섬나라 · 수도 도쿄 · 가장 높은 산 후지산",
      missions: [
        { type: "섬 탐정", prompt: "일본을 이루는 네 개의 큰 섬에 들어가지 않는 것은?", options: [["🏝️", "혼슈"], ["🏝️", "규슈"], ["🌴", "제주도"]], answer: 2, hint: "제주도는 대한민국의 섬이에요.", explain: "일본의 네 큰 섬은 홋카이도·혼슈·시코쿠·규슈예요. 제주도는 대한민국에 있어요." },
        { type: "도시 탐정", prompt: "일본의 수도는 어디일까?", options: [["🏯", "교토"], ["🏙️", "도쿄"], ["🌉", "오사카"]], answer: 1, hint: "일본에서 가장 큰 도시권의 중심이에요.", explain: "도쿄는 일본의 수도예요. 가장 큰 섬인 혼슈에 있어요." },
        { type: "자연 탐정", prompt: "일본에서 가장 높은 산은 무엇일까?", options: [["🗻", "후지산"], ["⛰️", "한라산"], ["🏔️", "에베레스트산"]], answer: 0, hint: "높이가 3,776m이고 정상에 눈이 쌓이기도 해요.", explain: "후지산은 일본에서 가장 높은 산이며 높이는 3,776m예요." }
      ]
    }
  ];

  const regionColors = { 아시아: "#efae42", 유럽: "#7183dc", 아프리카: "#63a95d", 아메리카: "#d96a69", 오세아니아: "#34a6a4", 남극: "#d4e8ea" };
  const state = { discovered: loadProgress(), activeCountry: null, missionIndex: 0, soundOn: false, view: "explore", globe: null, geojson: null, resizeObserver: null, returnFocus: null };
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

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.discovered])); } catch (_) { /* 저장을 쓸 수 없는 환경 */ }
  }

  function featureIso(feature) {
    const props = feature && feature.properties ? feature.properties : {};
    return [props.ISO_A3, props.ADM0_A3, props.GU_A3, props.SOV_A3].find(value => value && value !== "-99") || "";
  }

  function targetForFeature(feature) { return countries.find(country => country.iso === featureIso(feature)); }

  function flagAsset(country) { return `./assets/flags/${country.id}.svg`; }

  function countryTooltip(country) {
    const found = state.discovered.has(country.id);
    return `<div class="globe-country-label"><img src="${flagAsset(country)}" width="64" height="48" alt=""><span><b>${country.name}</b><small>${found ? "도감 열림 · 눌러서 다시 보기" : "아직 회색 나라 · 눌러서 탐험"}</small></span></div>`;
  }

  function polygonColor(feature) {
    const target = targetForFeature(feature);
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

  async function initGlobe() {
    els.globeError.hidden = true;
    els.globeLoading.hidden = false;
    try {
      if (typeof window.Globe !== "function") throw new Error("Globe.GL을 찾을 수 없습니다.");
      const response = await fetch("./data/countries.geojson");
      if (!response.ok) throw new Error("지도 데이터를 불러오지 못했습니다.");
      state.geojson = await response.json();
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
          return target ? countryTooltip(target) : "";
        })
        .onPolygonClick(feature => {
          const target = targetForFeature(feature);
          if (target) openCountry(target.id);
          else showToast("대한민국이나 일본 영토를 찾아 눌러 보자!");
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
      state.globe.pointOfView({ lat: 36.5, lng: 132.5, altitude: 1.34 }, 0);
      const controls = state.globe.controls();
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = false;
      if (state.globe.renderer) state.globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      state.resizeObserver = new ResizeObserver(sizeGlobe);
      state.resizeObserver.observe(els.globeWrap);
      if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
        window.__worldExplorerQA = { globe: state.globe, openCountry };
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
      .polygonStrokeColor(feature => {
        const target = targetForFeature(feature);
        return target && !state.discovered.has(target.id) ? "rgba(225,231,226,.92)" : "rgba(255,248,210,.78)";
      })
      .polygonAltitude(feature => {
        const target = targetForFeature(feature);
        return target ? (state.discovered.has(target.id) ? 0.026 : 0.014) : 0.007;
      })
      .polygonsData([...state.geojson.features]);
    state.globe.pointsData([...countries]);
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
    els.progressBar.style.transform = `scaleX(${count / total})`;
    els.progressTrack.setAttribute("aria-valuenow", String(count));
    els.progressTrack.setAttribute("aria-valuetext", `${total}개 나라 중 ${count}개 도감 완성`);
    document.querySelectorAll("[data-country-shortcut]").forEach(button => {
      const found = state.discovered.has(button.dataset.countryShortcut);
      const country = countries.find(item => item.id === button.dataset.countryShortcut);
      button.classList.toggle("is-found", found);
      const status = button.querySelector("small");
      if (status) status.textContent = found ? "도감 열림" : "아직 잠김";
      if (country) button.setAttribute("aria-label", `${country.name} ${found ? "도감 열림" : "아직 잠김"} 탐험하기`);
    });
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
    els.collectionGrid.classList.toggle("is-duo", countries.length === 2);
    els.collectionGrid.innerHTML = countries.map(country => {
      const found = state.discovered.has(country.id);
      if (found) {
        return `<button type="button" class="country-card is-found" data-open-country="${country.id}" style="--card-color:${country.color}"><span class="card-icon" aria-hidden="true">${country.icon}</span><span class="country-card-inner"><span class="card-flag" aria-hidden="true"><img src="${flagAsset(country)}" width="64" height="48" alt="" /></span><h3>${country.name}</h3><p>${country.region} · ${country.place}</p></span></button>`;
      }
      return `<div class="country-card is-locked" aria-label="아직 열리지 않은 ${country.name} 도감"><div class="country-card-inner"><span class="locked-flag" aria-hidden="true"><img src="${flagAsset(country)}" width="640" height="480" alt="" /><span class="mystery">?</span></span><h3>${country.name} 도감</h3><p>정보를 읽고 퀴즈 3개를 풀어 보세요.</p></div></div>`;
    }).join("");
    els.collectionGrid.querySelectorAll("[data-open-country]").forEach(button => button.addEventListener("click", () => openCountry(button.dataset.openCountry)));
  }

  function openCountry(id) {
    const country = countries.find(item => item.id === id);
    if (!country) return;
    state.activeCountry = country;
    state.missionIndex = 0;
    state.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    flyTo(country);
    els.guideTitle.textContent = `${country.name}에 도착!`;
    els.guideMessage.textContent = state.discovered.has(id) ? `${country.place} 이야기를 다시 읽거나 퀴즈를 풀어 보자.` : "정보 네 장을 읽고 퀴즈 세 개에 도전해 보자!";
    renderCountryIntro(country);
    els.dialog.hidden = false;
    setBackgroundInert(true);
    document.body.style.overflow = "hidden";
    window.setTimeout(() => els.dialog.querySelector("button")?.focus(), 40);
    if (state.soundOn) speak(`${country.name}에 도착했어요. ${country.story}`);
  }

  function renderCountryIntro(country) {
    const found = state.discovered.has(country.id);
    els.dialogContent.innerHTML = `
      <section style="--country-tint:${country.color};--country-accent:${country.accent}">
        <div class="country-hero">
          <div class="country-flag" aria-hidden="true"><img src="${flagAsset(country)}" width="640" height="480" alt="" /></div>
          <div><p class="eyebrow">${found ? "도감 다시 보기" : "새로운 나라 발견"}</p><h2 id="dialogTitle">${country.name}</h2><p>${country.region} · ${country.story}</p></div>
        </div>
        <dl class="country-quickfacts">${country.quickFacts.map(fact => `<div><dt>${fact[0]}</dt><dd>${fact[1]}</dd></div>`).join("")}</dl>
        <div class="learning-grid">${country.chapters.map(chapter => `<article class="learning-card"><div class="learning-title"><span aria-hidden="true">${chapter.icon}</span><h3>${chapter.title}</h3></div><p>${chapter.summary}</p><ul>${chapter.details.map(detail => `<li>${detail}</li>`).join("")}</ul></article>`).join("")}</div>
        <aside class="remember-strip"><span aria-hidden="true">⭐</span><div><strong>이것만은 기억해요</strong><p>${country.remember}</p></div></aside>
        <div class="dialog-actions">
          <button type="button" class="speak-button" id="speakCountry">🔊 전체 이야기 듣기</button>
          <button type="button" class="primary-button" id="startMission">${found ? "퀴즈 다시 풀기" : "3문제 퀴즈 시작"}</button>
        </div>
      </section>`;
    document.getElementById("speakCountry").addEventListener("click", () => speak(`${country.name}. ${country.story} ${country.chapters.map(chapter => `${chapter.title}. ${chapter.summary} ${chapter.details.join(" ")}`).join(" ")}`));
    document.getElementById("startMission").addEventListener("click", () => renderMission(country, 0));
  }

  function renderMission(country, index = 0) {
    state.missionIndex = index;
    const mission = country.missions[index];
    els.dialogContent.innerHTML = `
      <section class="mission-screen">
        <div class="mission-progress" aria-label="퀴즈 ${index + 1}/${country.missions.length}">
          <span>${index + 1} / ${country.missions.length}</span>
          <div>${country.missions.map((_, dotIndex) => `<i class="${dotIndex < index ? "is-done" : dotIndex === index ? "is-current" : ""}"></i>`).join("")}</div>
        </div>
        <div class="mission-badge">${mission.type}</div>
        <h2 id="dialogTitle">${mission.prompt}</h2>
        <p class="mission-hint" id="missionHint" role="status" aria-live="polite">천천히 보고 골라도 괜찮아요.</p>
        <div class="option-grid">${mission.options.map((option, optionIndex) => `<button type="button" class="option-button" data-option="${optionIndex}" aria-pressed="false"><span class="option-emoji" aria-hidden="true">${option[0]}</span>${option[1]}</button>`).join("")}</div>
        <div id="missionFeedback" class="mission-feedback" role="status" aria-live="polite"></div>
      </section>`;
    els.dialogContent.querySelectorAll("[data-option]").forEach(button => button.addEventListener("click", () => answerMission(country, mission, Number(button.dataset.option), button)));
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
        if (state.soundOn) speak(`세 문제를 모두 맞혔어요. ${country.name} 도감이 열렸어요.`);
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
    els.dialogContent.innerHTML = `<section class="success-screen"><div class="success-burst" aria-hidden="true">${country.icon}</div><p class="eyebrow">3문제를 모두 통과했어요</p><h2 id="dialogTitle">${country.name} 도감 완성!</h2><p>회색이던 ${country.name} 영토가 선명한 색으로 깨어났어요.</p><button type="button" class="primary-button" id="continueExplore">${state.discovered.size === countries.length ? "완성한 도감 보기" : "다음 나라 찾기"}</button></section>`;
    document.getElementById("continueExplore").addEventListener("click", () => {
      const complete = state.discovered.size === countries.length;
      closeCountryDialog();
      if (complete) setView("collection");
    });
  }

  function closeCountryDialog() {
    els.dialog.hidden = true;
    setBackgroundInert(false);
    document.body.style.overflow = "";
    els.guideTitle.textContent = state.discovered.size === countries.length ? "세계지도 완성!" : "다음에는 어디로 갈까?";
    els.guideMessage.textContent = state.discovered.size === countries.length ? "도감에서 두 나라 이야기를 다시 볼 수 있어." : "지구본을 다시 돌려 아직 회색인 나라를 찾아보자!";
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
    document.querySelectorAll("[data-country-shortcut]").forEach(button => button.addEventListener("click", () => openCountry(button.dataset.countryShortcut)));
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
      const activeDialog = !els.guardianDialog.hidden ? els.guardianDialog : !els.dialog.hidden ? els.dialog : null;
      if (activeDialog) trapFocus(activeDialog, event);
      if (event.key === "Escape") {
        if (!els.guardianDialog.hidden) closeGuardian();
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

  setupKidSafeGuards();
  bindEvents();
  setupMascot();
  renderProgress();
  renderCollection();
  initGlobe();
})();
