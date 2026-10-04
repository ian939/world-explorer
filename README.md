# 빙글빙글 세계탐험대

7~8세 어린이가 지구본을 직접 돌리고 나라를 발견하며 세계의 자연·문화·인사말을 익히는 iPad용 웹 게임 프로토타입입니다.

## 바로 하기

https://ian939.github.io/world-explorer/

`main` 브랜치에 push하면 GitHub Actions(`.github/workflows/pages.yml`)가 `dist/`를 GitHub Pages에 올립니다.

## 실행

별도의 설치나 빌드 과정이 없습니다. `dist/index.html`을 브라우저에서 열거나, 정적 파일 서버의 루트를 `dist`로 지정하면 실행됩니다.

## 포함된 기능

- Globe.GL과 실제 GeoJSON 국가 경계를 사용한 3D 지구본
- 그림책 구아슈 질감의 전용 2:1 바다 텍스처
- 드래그와 버튼으로 회전하며 5개 대륙의 60개 나라를 찾는 탐험
- 화면을 따라오는 핀 없이 국가 영역 위에서 뜨는 실제 SVG 국기 툴팁
- 대륙별로 묶은 60개 나라 국기 바로 가기 목록 (대륙 버튼으로 이동)
- 60개 나라 각각의 핵심 정보 3개, 상세 학습 카드 4개, 연속 퀴즈 3문제
- 잠긴 나라는 회색, 도감을 열면 고유 색으로 바뀌는 지도 상태
- 틀려도 실패하지 않고 힌트를 받는 퀴즈
- 대륙별 여권 페이지에 나라 도장이 찍히는 도감 (퀴즈 완주 때 "도장 쾅")
- 브라우저 기기에 자동 저장되는 발견 기록
- 한국어 음성 읽어주기
- 보호자 확인 후 진행 기록 초기화
- iPad Safari의 확대·선택·드래그·길게 누르기 방지
- 한국어 어절 단위 줄바꿈(`word-break: keep-all`), 긴 나라 이름은 글자를 줄여 한 줄로
- 화면 구석 버전 표시와 새 버전 자동 감지 (`<meta name="app-version">`, 패드 캐시 대비)
- 44px 이상 터치 영역, 키보드용 나라 선택, 모달 포커스 순환·복귀와 모션 감소 설정 지원

## 폴더 구성

```text
세계지도 탐험/
├─ .openai/hosting.json
├─ README.md
├─ qa-run.js
├─ docs/
│  ├─ 기획서.md
│  ├─ design-reference-prompts.md
│  └─ design-references/
└─ dist/
   ├─ index.html
   ├─ styles.css
   ├─ app.js
   ├─ assets/
   │  ├─ compass-mascot.png
   │  ├─ ocean-paper-texture.png
   │  └─ flags/
   ├─ data/
   │  ├─ countries.geojson
   │  ├─ country-content.js
   │  └─ country-content-extra.js
   └─ vendor/
      └─ globe.gl.min.js
```

현재 진행 기록은 `localStorage`에만 저장되므로 같은 브라우저와 기기에서 유지됩니다.

국기 SVG는 MIT 라이선스의 `lipis/flag-icons` 컬렉션을 사용하며 라이선스 전문은 `docs/third-party/LICENSE.flag-icons.txt`에 보관합니다.

`qa-run.js`는 Playwright에서 iPad 가로 터치 환경의 60개 국기·국가 경계·학습 콘텐츠, 대표 나라의 퀴즈 완주, 도감 저장과 보호 장치를 다시 확인할 때 사용하는 점검 시나리오입니다.

## 배포할 때

`dist/index.html`의 `app-version` 값과 파일 주소 끝 `?v=` 값을 함께 올립니다. 패드는 버전이 바뀐 것을 보고 위쪽에 "🎁 새 버전으로 바꾸기" 버튼을 띄웁니다.
