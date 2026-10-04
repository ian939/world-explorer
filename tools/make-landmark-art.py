"""나라 그림(두 형제 + 랜드마크) 만들기 — 캐릭터 에셋 합성 방식

새 나라를 추가할 때부터 쓰는 방식이다 (처음 60장은 그림 전체를 한 번에 그렸다).
  1) characters : 아이 사진 한 장 → 포즈별 캐릭터 그림 (투명 PNG)   — 사람마다 한 번
  2) art        : 나라마다 사람 없는 랜드마크 배경을 그리고 캐릭터를 얹는다

쓰는 법 (세계지도 탐험 폴더에서):
  python tools/make-landmark-art.py characters --photo 아이사진.jpg
  python tools/make-landmark-art.py art fr eg jp          # data/landmarks.js 에 있는 나라 id
  python tools/make-landmark-art.py art fr --pose jump    # 포즈를 골라서
  python tools/make-landmark-art.py art fr --redo-bg      # 배경을 다시 그리기

그림 생성은 Codex CLI(codex-imagegen 스킬의 gen_image.py)로 한다. 한 장에 4~6분.
아이 사진·캐릭터·배경 원본은 drafts/ (git 에 올리지 않음), 게임용 그림만 dist/assets/landmarks/ 에 쓴다.
"""
import argparse
import os
import re
import subprocess
import sys
from collections import deque

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRAFTS = os.path.join(ROOT, "drafts")
CHAR_DIR = os.path.join(DRAFTS, "characters")        # vsign.png, jump.png, wave.png
BG_DIR = os.path.join(DRAFTS, "landmark-bg")         # <id>.png (사람 없는 배경)
FULL_DIR = os.path.join(DRAFTS, "kids-landmarks", "kid")  # <id>.png (합성한 큰 그림)
STYLE_REF = os.path.join(FULL_DIR, "kr.png")          # 그림체 기준 (경복궁 크레파스 그림)
OUT_DIR = os.path.join(ROOT, "dist", "assets", "landmarks")
LANDMARKS_JS = os.path.join(ROOT, "dist", "data", "landmarks.js")
GEN = os.path.expanduser("~/.claude/skills/codex-imagegen/scripts/gen_image.py")

POSES = {
    "vsign": "both making V-signs with big laughing smiles",
    "jump": "the smaller boy jumping in the air with both arms up and the bigger boy cheering with both arms raised",
    "wave": "the smaller boy waving one hand and the bigger boy giving a thumbs up",
}
STYLE = ("a picture drawn by a 7-year-old child with crayons and colored markers: childlike wobbly lines, uneven crayon coloring, "
         "visible crayon texture, big round heads, dot eyes, rosy cheeks, huge happy smiles")
KIDS = ("the two brothers from the photo: the smaller boy on the left has a round black bowl-cut, a royal-blue sweatshirt with black sleeves, "
        "dark navy pants and grey sneakers; the taller boy on the right has short spiky black hair, an all royal-blue sweatshirt and pants and black sneakers")
CHAR_PROMPT = ("Use the first reference image (a photo) only to know who the two boys are and what they wear; use the second reference image only for the drawing style. "
               "Draw ONLY {kids}, full body, standing side by side and slightly overlapping, {pose}, in the style of {style}. "
               "Background must be completely plain pure white (#FFFFFF): no ground, no shadow, no scenery, no paper texture, nothing else in the picture. "
               "Leave white margin around them. Portrait 3:4. No text, no letters.")
BG_PROMPT = ("Use the reference image only for the drawing style. Draw a landscape picture with NO people and NO characters at all: {scene}. "
             "Same medium: a picture drawn by a 7-year-old child with crayons and colored markers, wobbly lines, uneven crayon coloring, "
             "scribbled crayon sky, a smiling sun in a corner, naive flat perspective, white paper showing through. Keep the lower-middle "
             "foreground as a simple open ground area (plaza, path or grass) with nothing standing on it, so two children can be added there later. "
             "Portrait 3:4. No text, no letters, no people, no animals in the foreground.")
# 캐릭터를 얹는 자리 (그림 높이 대비). landmarks.js 의 kids: { x, bottom, height } 로 나라마다 바꿀 수 있다.
DEFAULT_PLACE = {"x": 0.5, "bottom": 0.965, "height": 0.56}


def read_landmarks():
    src = open(LANDMARKS_JS, encoding="utf-8").read()
    items = {}
    for cid, body in re.findall(r'^\s+(\w\w): \{(.*)\},?$', src, re.M):
        scene = re.search(r'scene: "([^"]+)"', body)
        place = re.search(r'kids: \{([^}]*)\}', body)
        spot = dict(DEFAULT_PLACE)
        if place:
            spot.update({k: float(v) for k, v in re.findall(r'(\w+): ([\d.]+)', place.group(1))})
        items[cid] = {"scene": scene.group(1) if scene else "", "place": spot}
    return items


def generate(prompt, out, refs):
    args = [sys.executable, GEN, "--out", out, "--prompt", prompt]
    for ref in reversed(refs):  # 앞에 넣으므로 거꾸로 — 첫 번째 ref 가 첫 번째 참고 그림이 된다
        args[2:2] = ["--ref", ref]
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if not os.path.exists(out):
        raise SystemExit(f"그림이 만들어지지 않았어요: {out}\n{result.stdout[-800:]}{result.stderr[-800:]}")


def cut_out(path, out, thresh=232):
    """캐릭터만 남기고 배경을 투명하게. Codex 가 이미 투명 PNG 로 주면 그대로 쓴다."""
    src = Image.open(path)
    if src.mode == "RGBA" and src.split()[-1].getextrema()[0] < 10:
        im = src.crop(src.split()[-1].getbbox())
        im.save(out)
        return
    im = src.convert("RGBA")
    w, h = im.size
    px = im.load()
    is_bg = lambda p: p[0] >= thresh and p[1] >= thresh and p[2] >= thresh
    mask = Image.new("L", (w, h), 255)
    m = mask.load()
    seen = set()
    # 가장자리에서 이어진 흰 바탕
    q = deque([(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)])
    while q:
        x, y = q.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or not is_bg(px[x, y]):
            continue
        seen.add((x, y))
        m[x, y] = 0
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    # 두 아이 사이처럼 갇힌 큰 흰 바탕 (눈 흰자처럼 작은 흰 부분은 남긴다)
    for sy in range(0, h, 4):
        for sx in range(0, w, 4):
            if (sx, sy) in seen or not is_bg(px[sx, sy]):
                continue
            blob, stack = [], [(sx, sy)]
            while stack:
                x, y = stack.pop()
                if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or not is_bg(px[x, y]):
                    continue
                seen.add((x, y))
                blob.append((x, y))
                stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
            if len(blob) > 2500:
                for x, y in blob:
                    m[x, y] = 0
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    im.putalpha(mask)
    im.crop(mask.getbbox()).save(out)


def compose(bg_path, char_path, out, place):
    bg = Image.open(bg_path).convert("RGBA")
    char = Image.open(char_path).convert("RGBA")
    W, H = bg.size
    ch = int(H * place["height"])
    cw = int(char.width * ch / char.height)
    char = char.resize((cw, ch), Image.LANCZOS)
    x, y = int(W * place["x"] - cw / 2), int(H * place["bottom"]) - ch
    shadow = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse((x + cw * 0.08, y + ch * 0.95, x + cw * 0.92, y + ch * 1.04), fill=(90, 80, 70, 70))
    bg = Image.alpha_composite(bg, shadow.filter(ImageFilter.GaussianBlur(6)))
    bg.alpha_composite(char, (x, y))
    bg.convert("RGB").save(out)


def to_game_images(full_path, cid):
    """게임용: 480×640 WebP + 240×320 썸네일"""
    os.makedirs(os.path.join(OUT_DIR, "thumb"), exist_ok=True)
    im = Image.open(full_path).convert("RGB")
    w, h = im.size
    tw = int(h * 3 / 4)
    if w > tw:
        im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
    big = im.resize((480, 640), Image.LANCZOS)
    big.save(os.path.join(OUT_DIR, f"{cid}.webp"), "WEBP", quality=74, method=6)
    big.resize((240, 320), Image.LANCZOS).save(os.path.join(OUT_DIR, "thumb", f"{cid}.webp"), "WEBP", quality=72, method=6)


def cmd_characters(args):
    os.makedirs(CHAR_DIR, exist_ok=True)
    raw_dir = os.path.join(CHAR_DIR, "raw")
    os.makedirs(raw_dir, exist_ok=True)
    for pose, text in POSES.items():
        raw = os.path.join(raw_dir, f"{pose}.png")
        print(f"캐릭터 {pose} 그리는 중…", flush=True)
        generate(CHAR_PROMPT.format(kids=KIDS, pose=text, style=STYLE), raw, [args.photo, STYLE_REF])
        cut_out(raw, os.path.join(CHAR_DIR, f"{pose}.png"))
    print("캐릭터 완성:", CHAR_DIR)


def cmd_art(args):
    landmarks = read_landmarks()
    pose_names = list(POSES)
    os.makedirs(BG_DIR, exist_ok=True)
    os.makedirs(FULL_DIR, exist_ok=True)
    for cid in args.ids:
        if cid not in landmarks:
            raise SystemExit(f"{cid}: data/landmarks.js 에 먼저 name·scene 을 적어 주세요.")
        bg = os.path.join(BG_DIR, f"{cid}.png")
        if args.redo_bg or not os.path.exists(bg):
            print(f"{cid} 배경 그리는 중…", flush=True)
            generate(BG_PROMPT.format(scene=landmarks[cid]["scene"]), bg, [STYLE_REF])
        pose = args.pose or pose_names[sorted(landmarks).index(cid) % len(pose_names)]
        char = os.path.join(CHAR_DIR, f"{pose}.png")
        if not os.path.exists(char):
            raise SystemExit(f"캐릭터 그림이 없어요: {char} — 먼저 characters 를 실행하세요.")
        full = os.path.join(FULL_DIR, f"{cid}.png")
        compose(bg, char, full, landmarks[cid]["place"])
        to_game_images(full, cid)
        print(f"{cid} 완성 ({pose}) → dist/assets/landmarks/{cid}.webp", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("characters", help="아이 사진으로 포즈별 캐릭터 만들기")
    c.add_argument("--photo", required=True)
    a = sub.add_parser("art", help="나라 그림 만들기 (배경 + 캐릭터 합성)")
    a.add_argument("ids", nargs="+")
    a.add_argument("--pose", choices=list(POSES))
    a.add_argument("--redo-bg", action="store_true")
    args = parser.parse_args()
    {"characters": cmd_characters, "art": cmd_art}[args.cmd](args)


if __name__ == "__main__":
    main()
