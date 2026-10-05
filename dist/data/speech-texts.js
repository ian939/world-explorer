(function () {
  "use strict";

  // 앱이 소리 내어 읽는 문장을 한곳에서 만든다.
  // 미리 녹음한 소리(assets/voice/)는 이 문장 그대로를 열쇠로 찾으므로,
  // 앱(app.js)과 녹음 스크립트(tools/make-voice.*)가 반드시 이 파일을 함께 쓴다.
  // 조각 = { text } (한국어) 또는 { text, say, lang } (원어 인사, say = 한글 발음)

  function batchim(word) {
    const code = word.charCodeAt(word.length - 1) - 0xac00;
    return code >= 0 && code < 11172 ? code % 28 : 0;
  }
  function koCount(n) { return ["영", "한", "두", "세", "네", "다섯", "여섯", "일곱"][n] || String(n); }
  function native(country, line) { return { text: line.text, say: line.say, lang: country.greet.lang, rate: 0.8 }; }

  const CONTINENTS = ["아시아", "유럽", "아프리카", "아메리카", "오세아니아"];
  const HOME = "kr"; // 크기·거리를 견주는 기준: 우리나라
  function ieyo(word) { return batchim(word) ? "이에요" : "예요"; }

  // 상세 보기의 지도·크기·비행시간 문장. 화면 글과 읽는 소리가 같아야 보면서 따라 들을 수 있어서 한곳에서 만든다.
  // (capitals.js · country-size.js 를 쓴다 — 녹음 스크립트도 두 파일을 함께 불러야 한다)
  function facts(country) {
    const capitals = window.WORLD_EXPLORER_CAPITALS || {}, areas = window.WORLD_EXPLORER_AREA || {};
    const capital = capitals[country.id];
    const out = { capital };
    out.map = `색칠된 곳이 ${country.name}${ieyo(country.name)}.` + (capital ? ` 빨간 핀이 수도 ${capital.name}${ieyo(capital.name)}.` : "");
    const here = areas[country.id], home = areas[HOME];
    if (here && home) {
      if (country.id === HOME) {
        out.size = { text: "이웃 나라 중국, 일본과 크기를 견줘 봐요.", html: "이웃 나라 중국·일본과 크기를 견줘 봐요." };
      } else {
        const ratio = here / home;
        if (ratio < 1.5) {
          const text = ratio < 0.95 ? "대한민국보다 조금 작아요." : "대한민국과 크기가 비슷해요.";
          out.size = { text, html: text };
        } else {
          const n = Math.round(ratio);
          out.size = { text: `대한민국 땅 약 ${n}개를 합친 만큼 넓어요.`, html: `대한민국 땅 <b>약 ${n}개</b>를 합친 만큼 넓어요.` };
        }
      }
    }
    const from = capitals[HOME];
    if (from && capital && country.id !== HOME) {
      // 서울에서 그 나라 수도까지 곧장 날아갈 때 (비행기 시속 약 800km + 뜨고 내리는 시간)
      const rad = Math.PI / 180;
      const a = Math.sin((capital.lat - from.lat) * rad / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(capital.lat * rad) * Math.sin((capital.lon - from.lon) * rad / 2) ** 2;
      const km = Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) / 10) * 10;
      const hours = Math.max(1, Math.round(km / 800 + 0.5));
      out.flight = { km, hours, to: capital, text: `서울에서 곧장 날아가면 비행기로 약 ${hours}시간 걸려요.`, html: `서울에서 곧장 날아가면 비행기로 <b>약 ${hours}시간</b> 걸려요.` };
    }
    return out;
  }
  // "와! 진짜?" 처럼 감탄하는 카드 이름·제목은 소리 내어 읽으면 어색해서 내용만 읽는다
  const EXCLAIM_LABELS = ["와! 진짜?"];

  window.WORLD_EXPLORER_SPEECH = {
    CONTINENTS,
    koCount,
    native,
    facts,
    soundOn: () => [{ text: "소리를 켰어요." }],
    point: country => [{ text: `${country.name}, 여기 있어요. 반짝이는 곳을 눌러 보세요.` }],
    continent: name => [{ text: `${name}${batchim(name) && batchim(name) !== 8 ? "으로" : "로"} 가 볼까요?` }],
    arrival: country => [{ text: `${country.name}에 도착했어요. ${country.story}` }],
    success: country => [{ text: `${koCount(country.missions.length)} 문제를 모두 맞혔어요. ${country.name} 도감이 열렸어요.` }],
    greet: (country, line) => [native(country, line), { text: line.mean }],
    listen: (country, line) => [native(country, line)],
    story(country) {
      if (!country.cards) {
        return [{ text: `${country.name}. ${country.story} ${country.chapters.map(chapter => `${chapter.title}. ${chapter.summary} ${chapter.details.join(" ")}`).join(" ")}` }];
      }
      // at = 화면에서 지금 읽는 부분 (따라 읽기 표시·스크롤에 쓴다, 녹음 열쇠와는 상관없음)
      const info = facts(country);
      const parts = [{ text: `${country.name}. ${country.story}`, at: "hero" }];
      parts.push({ text: info.map, at: "map" });
      if (info.size) parts.push({ text: `얼마나 클까? ${info.size.text}`, at: "size" });
      if (info.flight) parts.push({ text: `얼마나 멀까? ${info.flight.text}`, at: "flight" });
      if (country.greet) {
        parts.push({ text: "인사 따라 하기.", at: "greet" });
        country.greet.lines.forEach(line => parts.push({ ...native(country, line), at: "greet" }, { text: line.mean, at: "greet" }));
        if (country.greet.note) parts.push({ text: country.greet.note, at: "greet" });
      }
      country.cards.forEach((card, i) => {
        const body = [...(card.lines || []), ...(card.list || [])].join(" ");
        const head = EXCLAIM_LABELS.includes(card.label) ? "" : `${card.label.replace(" · ", ", ")}. ${card.title}. `;
        parts.push({ text: head + body, at: `card-${i}` });
      });
      return parts;
    },

    // 녹음 파일 이름: "목소리|문장"의 FNV-1a 32비트 (녹음 스크립트도 같은 계산)
    voiceKey(part) { return `${part.lang || "ko"}|${part.text}`; },
    fallbackKey(part) { return part.lang && part.say ? `ko|${part.say}` : null; },
    hash(key) {
      let h = 0x811c9dc5;
      for (const byte of new TextEncoder().encode(key)) { h ^= byte; h = Math.imul(h, 0x01000193) >>> 0; }
      return h.toString(16).padStart(8, "0");
    }
  };
})();
