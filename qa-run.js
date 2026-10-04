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

  const countryAudit = await page.evaluate(async () => {
    const { countries, globe } = window.__worldExplorerQA;
    const polygonIsos = new Set(globe.polygonsData().map(feature => {
      const properties = feature.properties || {};
      return [properties.ISO_A3, properties.ADM0_A3, properties.GU_A3, properties.SOV_A3].find(value => value && value !== '-99');
    }));
    const flagChecks = await Promise.all(countries.map(async country => ({
      id: country.id,
      ok: (await fetch(`./assets/flags/${country.id}.svg`)).ok
    })));
    return {
      count: countries.length,
      shortcutCount: document.querySelectorAll('[data-country-shortcut]').length,
      invalidContent: countries.filter(country => country.quickFacts.length !== 3 || country.chapters.length !== 4 || country.missions.length !== 3).map(country => country.id),
      missingPolygons: countries.filter(country => !polygonIsos.has(country.iso)).map(country => country.iso),
      missingFlags: flagChecks.filter(flag => !flag.ok).map(flag => flag.id)
    };
  });

  for (const countryId of await page.evaluate(() => window.__worldExplorerQA.countries.map(country => country.id))) {
    await page.evaluate(id => window.__worldExplorerQA.openCountry(id), countryId);
    await page.locator('#dialogTitle').waitFor();
    assert(await page.locator('.country-quickfacts div').count() === 3, `${countryId} quick facts should be 3`);
    assert(await page.locator('.learning-card').count() === 4, `${countryId} learning cards should be 4`);
    await page.keyboard.press('Escape');
  }

  const shortcut = page.locator('[data-country-shortcut="kr"]');
  await shortcut.focus();
  await shortcut.click();
  await page.locator('#dialogTitle').waitFor();
  const dialogMainInert = await page.locator('main').evaluate(element => element.inert);
  await page.locator('#closeDialog').focus();
  await page.keyboard.press('Shift+Tab');
  const focusTrapTarget = await page.evaluate(() => document.activeElement?.id || document.activeElement?.textContent?.trim());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(50);
  const shortcutFocusReturned = await shortcut.evaluate(element => document.activeElement === element);

  const kidGuardResults = await page.evaluate(() => {
    const dispatch = (target, event) => {
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const touch = index => new Touch({ identifier: index, target: document.body, clientX: 20 + index, clientY: 20 + index });
    return {
      multiTouchPrevented: dispatch(document, new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [touch(1), touch(2)] })),
      contextMenuPrevented: dispatch(document.body, new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
      selectionPrevented: dispatch(document.body, new Event('selectstart', { bubbles: true, cancelable: true })),
      dragPrevented: dispatch(document.body, new DragEvent('dragstart', { bubbles: true, cancelable: true })),
      childPastePrevented: dispatch(document.body, new ClipboardEvent('paste', { bubbles: true, cancelable: true }))
    };
  });

  await page.getByRole('button', { name: '보호자 설정' }).click();
  const adultPasteAllowed = await page.locator('#guardianAnswer').evaluate(element => {
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return !event.defaultPrevented;
  });
  await page.keyboard.press('Escape');

  const visibleTargetSizes = await page.locator('button, a').evaluateAll(elements => elements
    .filter(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    })
    .map(element => {
      const rect = element.getBoundingClientRect();
      return { label: element.getAttribute('aria-label') || element.textContent.trim(), width: rect.width, height: rect.height };
    }));

  const result = {
    viewport: await page.locator('meta[name="viewport"]').getAttribute('content'),
    progressStart: await page.locator('#progressText').textContent(),
    webglCanvasCount: await page.locator('#globeCanvas canvas').count(),
    pinCount: await page.locator('.country-flag-marker').count(),
    bodyUserSelect: await page.locator('body').evaluate(el => getComputedStyle(el).userSelect),
    canvasTouchAction: await page.locator('#globeCanvas canvas').evaluate(el => getComputedStyle(el).touchAction),
    dialogMainInert,
    focusTrapTarget,
    shortcutFocusReturned,
    kidGuardResults,
    adultPasteAllowed,
    countryAudit,
    minimumTarget: visibleTargetSizes.reduce((minimum, target) => Math.min(minimum, target.width, target.height), Infinity)
  };
  result.koreaHover = await completeCountry(page, { id: 'kr', name: '대한민국', lat: 36.2, lng: 127.8 }, [0, 0, 0]);
  await page.getByRole('button', { name: '다음 나라 찾기' }).click();
  result.japanOpened = await completeCountry(page, { id: 'jp', name: '일본', lat: 37.1, lng: 138.2 }, [2, 1, 0], true);
  await page.getByRole('button', { name: '다음 나라 찾기' }).click();
  result.chinaOpened = await completeCountry(page, { id: 'cn', name: '중국', lat: 35.9, lng: 104.2 }, [0, 1, 0], true);
  await page.getByRole('button', { name: '다음 나라 찾기' }).click();
  await page.getByRole('tab', { name: /나의 세계도감/ }).click();
  result.progressComplete = await page.locator('#progressText').textContent();
  result.collectionCards = await page.locator('[data-open-country]').count();
  result.collectionTotal = await page.locator('.country-card').count();
  result.collectionLocked = await page.locator('.country-card.is-locked').count();
  await page.screenshot({ path: 'test-results/ipad-landscape-complete.png', fullPage: true });

  const persistedPage = await context.newPage();
  await persistedPage.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  result.progressPersisted = await persistedPage.locator('#progressText').textContent();
  result.errors = errors;
  assert(result.progressStart === '0 / 12', 'fresh progress should be 0 / 12');
  assert(result.countryAudit.count === 12, 'country dataset should include 12 countries');
  assert(result.countryAudit.shortcutCount === 12, 'all 12 countries need a flag shortcut');
  assert(result.countryAudit.invalidContent.length === 0, `invalid country content: ${result.countryAudit.invalidContent.join(', ')}`);
  assert(result.countryAudit.missingPolygons.length === 0, `missing country polygons: ${result.countryAudit.missingPolygons.join(', ')}`);
  assert(result.countryAudit.missingFlags.length === 0, `missing country flags: ${result.countryAudit.missingFlags.join(', ')}`);
  assert(result.pinCount === 0, 'legacy pins should not exist');
  assert(result.webglCanvasCount === 1, 'globe canvas should exist');
  assert(result.dialogMainInert, 'background must be inert while a dialog is open');
  assert(result.focusTrapTarget === 'startMission' || String(result.focusTrapTarget).includes('3문제 퀴즈 시작'), 'dialog focus should wrap to the final action');
  assert(result.shortcutFocusReturned, 'closing a dialog should restore focus');
  assert(Object.values(result.kidGuardResults).every(Boolean), 'kid-safe gesture, selection, drag, context-menu, and clipboard guards should prevent child-surface actions');
  assert(result.adultPasteAllowed, 'adult controls should preserve native clipboard behavior');
  assert(result.minimumTarget >= 44, `visible targets should be at least 44px; received ${result.minimumTarget}`);
  assert(result.progressComplete === '3 / 12', 'three completed journeys should update progress');
  assert(result.progressPersisted === '3 / 12', 'progress should persist');
  assert(result.collectionCards === 3, 'three atlas cards should unlock');
  assert(result.collectionTotal === 12, 'atlas should render all 12 countries');
  assert(result.collectionLocked === 9, 'remaining nine atlas cards should stay locked');
  assert(errors.length === 0, `page errors: ${errors.join('; ')}`);
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
