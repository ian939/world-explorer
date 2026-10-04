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

  window.WORLD_EXPLORER_SPEECH = {
    CONTINENTS,
    koCount,
    native,
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
      const parts = [{ text: `${country.name}. ${country.story}` }];
      if (country.greet) {
        parts.push({ text: "인사 따라 하기." });
        country.greet.lines.forEach(line => parts.push(native(country, line), { text: line.mean }));
        if (country.greet.note) parts.push({ text: country.greet.note });
      }
      country.cards.forEach(card => parts.push({ text: `${card.label.replace(" · ", ", ")}. ${card.title}. ${[...(card.lines || []), ...(card.list || [])].join(" ")}` }));
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
