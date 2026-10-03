# 디자인 레퍼런스 및 이미지 생성 프롬프트

이번 리디자인은 built-in `imagegen`으로 만든 2개의 UI 레퍼런스와 1개의 실제 바다 텍스처를 사용했다.

## 생성 결과

- `design-references/exploration-game-primary-screen.png` — 탐험 메인 화면 레퍼런스
- `design-references/world-encyclopedia-collection-screen.png` — 세계도감 화면 레퍼런스
- `design-references/globe-ocean-texture-cobalt-turquoise-2x1.png` — 실제 지구본에 사용한 2:1 바다 텍스처
- `../dist/assets/ocean-paper-texture.png` — 배포용 바다 텍스처

## 1. 탐험 메인 화면

```text
Use case: ui-mockup
Asset type: exploration game primary screen reference, premium shipped-game quality, implementation-friendly
Primary request: Create one polished full-screen landscape iPad game UI for fluent-reading Korean children age 7–8. The game area must be the unmistakable focal point.
Scene/backdrop: clean, spacious tactile atlas / modern picture-book world on warm off-white paper texture; open composition, not boxed dashboard panels.
Subject: center-left dominated by a beautiful rotatable 3D globe with geographically convincing continents and country boundaries, deep cobalt ocean, dimensional layered cut-paper and gouache land surfaces, subtle atmospheric rim, shadows, and gentle ocean texture. Place several chunky sunny-yellow mystery pins marked with “?” on different countries. Show one discovered country with a charming animal sticker.
Interface: compact top bar with the game title “지구본 탐험” and progress “1/12”. On the right or lower-right, a friendly round cobalt-blue compass mascot wearing an orange explorer cap gives a short speech bubble reading “지구본을 돌려 나라를 찾아봐!”. Bottom navigation contains exactly two large touch-friendly tabs, labeled “지구본 탐험” and “나의 세계도감”.
Style/medium: premium tactile 3D storybook UI, playful modern Korean educational game, layered paper-cut shapes and soft gouache texture, bold friendly Korean grotesk typography, cohesive production-ready art direction.
Composition/framing: landscape iPad 4:3, complete edge-to-edge screen, clear visual hierarchy, ample breathing room, large 44px-plus-looking touch targets, globe is largest element, mascot secondary, navigation clean and anchored.
Lighting/mood: bright optimistic daylight, soft sculptural shadows, warm and adventurous.
Color palette: deep cobalt blue ocean and mascot, sunny yellow, tangerine orange, off-white paper, restrained natural land colors.
Text (verbatim, and no other readable text): “지구본 탐험”, “1/12”, “지구본을 돌려 나라를 찾아봐!”, “나의 세계도감”, and “?” on mystery pins.
Constraints: render Korean text clearly and exactly; exactly two bottom navigation tabs; accurate-looking globe geography and country divisions; one animal sticker; no extra labels or numbers; no accidental additional writing; no brand logos or watermark.
Avoid: generic dashboard cards, grids of panels, purple AI gradients, photorealism, ads, external brands, dense UI, tiny controls, illegible text, incorrect extra Korean copy.
```

## 2. 세계도감 화면

```text
Use case: ui-mockup
Asset type: encyclopedia collection screen reference for the same premium Korean children's iPad game
Primary request: Create one polished full-screen landscape iPad UI for “나의 세계도감”, matching a premium tactile atlas / modern picture-book game world for fluent-reading Korean children age 7–8.
Scene/backdrop: a warm off-white paper map backdrop with subtle coastlines, folds, and layered cut-paper depth. The composition should feel like a large open illustrated atlas spread, spacious and editorial, not a generic equal-card dashboard.
Subject: six discovered country entries arranged as an asymmetric editorial constellation of dimensional stamps and picture-book cards across the atlas. Each discovered entry is represented primarily by charming sticker art: one tiger, one panda, one giraffe, one Eiffel Tower, one colorful parrot, and one kangaroo. Several still-locked regions appear as tasteful torn-paper country or region silhouettes marked with “?”.
Interface: compact top area with title “나의 세계도감” and progress “6/12”. Include the same friendly round cobalt-blue compass mascot wearing an orange explorer cap as a small guide element integrated naturally into the atlas composition. Bottom navigation contains exactly two large touch-friendly tabs labeled “지구본 탐험” and “나의 세계도감”, with “나의 세계도감” clearly active.
Style/medium: premium shipped-game UI, tactile layered paper-cut and soft gouache, modern Korean picture-book illustration, dimensional sticker art, bold friendly Korean grotesk typography, clean and implementation-friendly.
Composition/framing: landscape iPad 4:3, complete edge-to-edge screen, asymmetrical editorial grid with deliberate scale variation and overlaps, large touch targets, generous open space, clear hierarchy, no nested panels.
Lighting/mood: sunny, optimistic museum-atlas mood with soft sculptural shadows.
Color palette: deep cobalt blue, sunny yellow, tangerine orange, off-white paper, restrained natural animal and landscape colors.
Materials/textures: handmade paper fibers, torn edges, gouache brush grain, embossed stamp borders, subtle shadows.
Text (verbatim, and no other readable text): “나의 세계도감”, “6/12”, “지구본 탐험”, and “?” on locked regions.
Constraints: render Korean text clearly and exactly; show all six specified discovered sticker subjects once each; several tasteful locked paper silhouettes; exactly two bottom navigation tabs; labels large, sparse, and readable; no country-name captions, no extra copy, no extra numbers, no brand logos, no watermark.
Avoid: generic equal-card dashboard, repetitive card grid, dense labels, tiny controls, purple AI gradients, photorealism, ads, external brands, clutter, illegible or invented text.
```

## 3. 바다 텍스처

```text
Use case: stylized-concept
Asset type: production-ready equirectangular ocean color texture for wrapping a 3D globe sphere in a premium Korean children's iPad educational game
Primary request: Create a single seamless abstract painted ocean texture in an exact 2:1 equirectangular flat-map layout. The entire canvas is ocean only, designed to wrap continuously around a sphere.
Scene/backdrop: none; this is a flat texture map, not a scene.
Subject: richly layered deep cobalt-blue ocean with restrained turquoise currents, subtle soft wave-like pigment variation, gentle gouache depth, and understated handmade paper fibers. Keep the pattern abstract, evenly distributed, and non-directional enough to survive globe projection.
Style/medium: tactile modern picture-book gouache and layered painted-paper surface, polished and premium, stylized rather than photorealistic.
Composition/framing: exact 2:1 horizontal equirectangular texture; edge-to-edge ocean; left and right edges visually seamless and tile-compatible; top and bottom suitable for spherical polar wrapping; no focal point, no central object, no visible horizon, no perspective, no lighting vignette.
Color palette: predominantly deep cobalt blue with subtle turquoise and slightly lighter blue painted variation; controlled contrast; no purple.
Materials/textures: fine paper fibers, natural gouache brush grain, shallow layered pigment depth; no heavy impasto ridges.
Text: none.
Constraints: ocean pixels across the full canvas; seamless horizontal wrap; flat albedo-like map texture; sphere-wrapping safe; uniform visual density; no land of any kind; no islands; no coastlines; no ice; no clouds; no stars; no sun reflection; no horizon; no waves seen in perspective; no borders or padding; no text; no labels; no symbols; no objects; no watermark.
Avoid: map labels, geographic features, recognizable continents, boats, animals, UI elements, logos, photorealism, 3D globe rendering, camera perspective, directional horizon bands, hard seams, strong polar features.
```
