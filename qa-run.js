const { chromium } = require(process.argv[2]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function hoverCountry(page, name, lat, lng) {
  const box = await page.locator('#globeWrap').boundingBox();
  const point = await page.evaluate(
    ([countryLat, countryLng]) => window.__worldExplorerQA.globe.getScreenCoords(countryLat, countryLng, 0.012),
    [lat, lng]
  );
  const location = { x: box.x + point.x, y: box.y + point.y };
  await page.mouse.move(location.x, location.y);
  await page.waitForTimeout(150);
  assert(await page.locator('.globe-country-label b').textContent() === name, `${name} hover tooltip missing`);
  return location;
}

async function completeCountry(page, country, answers, useLocalHook = false) {
  let location = null;
  if (useLocalHook) {
    await page.evaluate(countryId => window.__worldExplorerQA.openCountry(countryId), country.id);
  } else {
    location = await hoverCountry(page, country.name, country.lat, country.lng);
    await page.mouse.click(location.x, location.y);
  }
  await page.locator('#dialogTitle').waitFor();
  assert(await page.locator('#dialogTitle').textContent() === country.name, `${country.name} dialog missing`);
  assert(await page.locator('.country-quickfacts div').count() === 3, `${country.name} quick facts should be 3`);
  assert(await page.locator('.learning-card').count() === 4, `${country.name} learning cards should be 4`);
  await page.getByRole('button', { name: '3문제 퀴즈 시작' }).click();
  for (const answer of answers) {
    await page.locator(`[data-option="${answer}"]`).click();
    await page.locator('#nextMission').click();
  }
  await page.locator('.success-screen').waitFor();
  return location;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1194, height: 834 }, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__worldExplorerQA?.globe));

  const result = {
    viewport: await page.locator('meta[name="viewport"]').getAttribute('content'),
    progressStart: await page.locator('#progressText').textContent(),
    webglCanvasCount: await page.locator('#globeCanvas canvas').count(),
    pinCount: await page.locator('.country-flag-marker').count(),
    bodyUserSelect: await page.locator('body').evaluate(el => getComputedStyle(el).userSelect),
    canvasTouchAction: await page.locator('#globeCanvas canvas').evaluate(el => getComputedStyle(el).touchAction)
  };
  result.koreaHover = await completeCountry(page, { id: 'kr', name: '대한민국', lat: 36.2, lng: 127.8 }, [0, 0, 0]);
  await page.getByRole('button', { name: '다음 나라 찾기' }).click();
  result.japanOpened = await completeCountry(page, { id: 'jp', name: '일본', lat: 37.1, lng: 138.2 }, [2, 1, 0], true);
  await page.getByRole('button', { name: '완성한 도감 보기' }).click();
  result.progressComplete = await page.locator('#progressText').textContent();
  result.collectionCards = await page.locator('[data-open-country]').count();
  await page.screenshot({ path: 'test-results/ipad-landscape-complete.png', fullPage: true });

  const persistedPage = await context.newPage();
  await persistedPage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  result.progressPersisted = await persistedPage.locator('#progressText').textContent();
  result.errors = errors;
  assert(result.progressStart === '0 / 2', 'fresh progress should be 0 / 2');
  assert(result.pinCount === 0, 'legacy pins should not exist');
  assert(result.webglCanvasCount === 1, 'globe canvas should exist');
  assert(result.progressComplete === '2 / 2', 'journey should complete');
  assert(result.progressPersisted === '2 / 2', 'progress should persist');
  assert(result.collectionCards === 2, 'both atlas cards should unlock');
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
