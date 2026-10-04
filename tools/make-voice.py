"""앱이 읽는 문장을 미리 녹음해 dist/assets/voice/<hash>.mp3 로 저장한다.

- 한국어: ko-KR-SunHiNeural (선희)
- 원어 인사: 그 나라 말 목소리 (Edge 신경망 목소리). 목소리가 없는 말은 한글 발음(say)을 선희가 읽는다.
- 이미 있는 파일은 다시 만들지 않는다. 더는 쓰지 않는 파일은 지운다.
- 마지막에 dist/data/voice-index.js (녹음이 있는 hash 목록)를 쓴다.

사용: pip install edge-tts  →  python tools/make-voice.py
"""
import asyncio, json, os, subprocess, sys

import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "dist", "assets", "voice")
INDEX = os.path.join(ROOT, "dist", "data", "voice-index.js")
KOREAN = "ko-KR-SunHiNeural"
KOREAN_RATE = "-8%"
NATIVE_RATE = "-15%"
# 그 나라 아랍어 목소리가 없을 때 쓸 가까운 아랍어
LANG_ALIAS = {"ar-MR": "ar-SA", "ar-SD": "ar-SA", "ar-TD": "ar-SA"}


def fnv1a(key):
    h = 0x811C9DC5
    for b in key.encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f"{h:08x}"


async def pick_voices():
    voices = await edge_tts.list_voices()
    by_locale = {}
    for v in voices:
        by_locale.setdefault(v["Locale"], []).append(v)
    def choose(lang):
        lang = LANG_ALIAS.get(lang, lang)
        if lang == "ko-KR":
            return KOREAN
        options = by_locale.get(lang, [])
        if not options:
            return None
        female = [v for v in options if v["Gender"] == "Female"]
        return (female or options)[0]["ShortName"]
    return choose


async def main():
    texts = json.loads(subprocess.check_output(["node", os.path.join(ROOT, "tools", "voice-texts.js")], encoding="utf-8"))
    choose = await pick_voices()
    jobs = {}  # hash -> (text, voice, rate)
    no_voice = set()
    for t in texts:
        assert fnv1a(t["key"]) == t["hash"], t["key"]
        if t["lang"] == "ko":
            jobs[t["hash"]] = (t["text"], KOREAN, KOREAN_RATE)
            continue
        voice = choose(t["lang"])
        if voice:
            jobs[t["hash"]] = (t["text"], voice, NATIVE_RATE)
        else:
            no_voice.add(t["lang"])
            jobs[t["fallbackHash"]] = (t["say"], KOREAN, NATIVE_RATE)
    keys = [t["key"] for t in texts]
    assert len({fnv1a(k) for k in keys}) == len(keys), "hash 충돌"

    os.makedirs(OUT, exist_ok=True)
    todo = [h for h in jobs if not os.path.exists(os.path.join(OUT, f"{h}.mp3"))]
    print(f"문장 {len(jobs)}개 · 새로 녹음 {len(todo)}개 · 원어 목소리 없음: {', '.join(sorted(no_voice)) or '-'}", flush=True)

    sem = asyncio.Semaphore(6)
    done = 0
    failed = []
    async def record(h):
        nonlocal done
        text, voice, rate = jobs[h]
        path = os.path.join(OUT, f"{h}.mp3")
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, voice, rate=rate).save(path + ".part")
                    os.replace(path + ".part", path)
                    break
                except Exception as error:  # 일시적인 연결 오류는 다시 시도
                    if attempt == 3:
                        failed.append((h, voice, text[:40], str(error)[:80]))
                    await asyncio.sleep(2 * (attempt + 1))
        done += 1
        if done % 50 == 0:
            print(f"  {done}/{len(todo)}", flush=True)
    await asyncio.gather(*(record(h) for h in todo))

    for name in os.listdir(OUT):
        if name.endswith(".mp3") and name[:-4] not in jobs:
            os.remove(os.path.join(OUT, name))
    have = sorted(h for h in jobs if os.path.exists(os.path.join(OUT, f"{h}.mp3")))
    with open(INDEX, "w", encoding="utf-8", newline="\n") as f:
        f.write("// tools/make-voice.py가 만든 파일 — 미리 녹음한 소리가 있는 문장의 hash 목록 (assets/voice/<hash>.mp3)\n")
        f.write(f'window.WORLD_EXPLORER_VOICE = "{" ".join(have)}";\n')
    size = sum(os.path.getsize(os.path.join(OUT, f"{h}.mp3")) for h in have)
    print(f"녹음 {len(have)}개 · {size / 1024 / 1024:.1f}MB · 실패 {len(failed)}개")
    for f in failed:
        print("  실패:", f)
    sys.exit(1 if failed else 0)


asyncio.run(main())
