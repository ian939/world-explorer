// 앱이 읽는 모든 문장을 뽑아 JSON으로 내보낸다 (make-voice.py가 읽음).
// 사용: node tools/voice-texts.js > texts.json
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DATA = path.join(__dirname, "..", "dist", "data");
const context = { window: {}, TextEncoder };
vm.createContext(context);
for (const file of ["country-content.js", "country-content-extra.js", "country-guide.js", "capitals.js", "country-size.js", "speech-texts.js"]) {
  vm.runInContext(fs.readFileSync(path.join(DATA, file), "utf8"), context, { filename: file });
}
const countries = context.window.WORLD_EXPLORER_COUNTRIES;
const S = context.window.WORLD_EXPLORER_SPEECH;

const parts = [...S.soundOn(), ...S.CONTINENTS.flatMap(name => S.continent(name))];
for (const country of countries) {
  parts.push(...S.point(country), ...S.arrival(country), ...S.success(country), ...S.story(country));
  if (country.greet) country.greet.lines.forEach(line => parts.push(...S.greet(country, line)));
}

const seen = new Map();
for (const part of parts) {
  const key = S.voiceKey(part);
  if (!seen.has(key)) seen.set(key, { key, hash: S.hash(key), text: part.text, lang: part.lang || "ko", say: part.say || null, fallbackKey: S.fallbackKey(part), fallbackHash: S.fallbackKey(part) ? S.hash(S.fallbackKey(part)) : null });
}
process.stdout.write(JSON.stringify([...seen.values()], null, 1));
