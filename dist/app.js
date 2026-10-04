(function () {
  "use strict";

  const STORAGE_KEY = "world-explorer-progress-v2";
  const countries = Array.isArray(window.WORLD_EXPLORER_COUNTRIES) ? window.WORLD_EXPLORER_COUNTRIES : [];

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

  const continentOrder = ["아시아", "유럽", "아프리카", "아메리카", "오세아니아"];
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
      if (state.globe.renderer) state.globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      state.resizeObserver = new ResizeObserver(sizeGlobe);
      state.resizeObserver.observe(els.globeWrap);
      if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
        window.__worldExplorerQA = { globe: state.globe, openCountry, countries };
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
    if (state.globe) state.globe.pointOfView({ lat: country.lat, lng: country.lon, altitude: 1.62 }, 750);
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
      if (status) status.textContent = found ? "도장 받음" : "";
      if (country) button.setAttribute("aria-label", `${country.name} ${found ? "도장 받음" : "아직 못 감"} 탐험하기`);
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
    jump.innerHTML = groups.map(group => `<button type="button" data-jump="${group.name}" style="--continent:${group.color}">${group.name}</button>`).join("");
    jump.querySelectorAll("[data-jump]").forEach(button => button.addEventListener("click", () => {
      const target = document.getElementById(`shortcut-${button.dataset.jump}`);
      if (!target) return;
      const vertical = rail.scrollHeight > rail.clientHeight + 4;
      rail.scrollTo(vertical ? { top: target.offsetTop - rail.offsetTop, behavior: "smooth" } : { left: target.offsetLeft - rail.offsetLeft, behavior: "smooth" });
    }));
  }

  function renderCollection() {
    els.collectionGrid.innerHTML = countriesByContinent().map(group => {
      const foundCount = group.list.filter(country => state.discovered.has(country.id)).length;
      const cards = group.list.map((country, index) => {
        const tilt = [-4, 3, -2, 5, -3, 2][index % 6];
        if (state.discovered.has(country.id)) {
          return `<button type="button" class="country-card is-found" data-open-country="${country.id}" style="--tilt:${tilt}deg" aria-label="${country.name} 도장, 다시 보기"><span class="stamp"><span class="card-icon" aria-hidden="true">${country.icon}</span><span class="card-flag" aria-hidden="true"><img src="${flagAsset(country)}" width="64" height="48" alt="" /></span><h3 class="${nameClass(country)}">${country.name}</h3><span class="stamp-ring" aria-hidden="true">${group.name} · 도착</span></span></button>`;
        }
        return `<div class="country-card is-locked" aria-label="아직 도장이 없는 ${country.name}"><span class="stamp-slot"><span class="locked-flag" aria-hidden="true"><img src="${flagAsset(country)}" width="64" height="48" alt="" /></span><h3 class="${nameClass(country)}">${country.name}</h3></span></div>`;
      }).join("");
      return `<section class="passport-page" style="--continent:${group.color}" aria-labelledby="page-${group.name}"><header><h2 id="page-${group.name}">${group.name}</h2><span>${foundCount} / ${group.list.length}</span></header><div class="stamp-grid">${cards}</div></section>`;
    }).join("");
    els.collectionGrid.querySelectorAll("[data-open-country]").forEach(button => button.addEventListener("click", () => openCountry(button.dataset.openCountry)));
  }

  function openCountry(id, options = {}) {
    const country = countries.find(item => item.id === id);
    if (!country) return;
    state.activeCountry = country;
    state.missionIndex = 0;
    state.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!options.skipFly) flyTo(country);
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
          <div><p class="eyebrow">${country.region} · ${found ? "도감 다시 보기" : "새로운 나라 발견"}</p><h2 id="dialogTitle">${country.name}</h2><p>${country.story}</p></div>
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
    const optionOffset = (country.id.charCodeAt(0) + country.id.charCodeAt(1) + index) % mission.options.length;
    const displayOptions = mission.options.map((option, originalIndex) => ({ option, originalIndex }));
    displayOptions.push(...displayOptions.splice(0, optionOffset));
    els.dialogContent.innerHTML = `
      <section class="mission-screen">
        <div class="mission-progress" aria-label="퀴즈 ${index + 1}/${country.missions.length}">
          <span>${index + 1} / ${country.missions.length}</span>
          <div>${country.missions.map((_, dotIndex) => `<i class="${dotIndex < index ? "is-done" : dotIndex === index ? "is-current" : ""}"></i>`).join("")}</div>
        </div>
        <div class="mission-badge">${mission.type}</div>
        <h2 id="dialogTitle">${mission.prompt}</h2>
        <p class="mission-hint" id="missionHint" role="status" aria-live="polite">천천히 보고 골라도 괜찮아요.</p>
        <div class="option-grid">${displayOptions.map(({ option, originalIndex }) => `<button type="button" class="option-button" data-option="${originalIndex}" aria-pressed="false"><span class="option-emoji" aria-hidden="true">${option[0]}</span>${option[1]}</button>`).join("")}</div>
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
    els.dialogContent.innerHTML = `<section class="success-screen" style="--continent:${regionColors[continentOf(country)]}"><div class="success-stamp" aria-hidden="true"><span class="card-icon">${country.icon}</span><b class="${nameClass(country)}">${country.name}</b><small>${continentOf(country)} · 도착</small></div><p class="eyebrow">3문제를 모두 맞혔어요</p><h2 id="dialogTitle">${country.name} 도장 쾅!</h2><p>지구본에서 ${country.name} 땅이 색깔로 바뀌었어요.</p><button type="button" class="primary-button" id="continueExplore">${state.discovered.size === countries.length ? "완성한 도감 보기" : "다음 나라 찾기"}</button></section>`;
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
    els.updateButton.addEventListener("click", () => location.replace(`${location.pathname}?v=${Date.now()}`));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) checkUpdate(); });
    window.addEventListener("online", checkUpdate);
    window.setInterval(checkUpdate, 600000);
    checkUpdate();
  }

  setupKidSafeGuards();
  setupUpdateCheck();
  renderCountryShortcuts();
  bindEvents();
  setupMascot();
  renderProgress();
  renderCollection();
  initGlobe();
})();
