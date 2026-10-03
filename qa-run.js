async (page) => {
  await page.goto('http://127.0.0.1:4173');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const result = {};
  result.touchPoints = await page.evaluate(() => navigator.maxTouchPoints);
  result.viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
  result.bodyUserSelect = await page.locator('body').evaluate(el => getComputedStyle(el).userSelect);
  result.globeTouchAction = await page.locator('#globeWrap').evaluate(el => getComputedStyle(el).touchAction);

  const marker = page.locator('[data-country="kr"]');
  result.markerVisible = await marker.isVisible();
  result.markerBox = await marker.boundingBox();
  await marker.tap();
  result.dialogCountry = await page.locator('#dialogTitle').textContent();
  await page.getByRole('button', { name: '탐험 미션 시작' }).tap();
  await page.getByRole('button', { name: /안녕하세요/ }).tap();
  result.success = await page.locator('#dialogTitle').textContent();
  await page.getByRole('button', { name: '다음 나라 찾기' }).tap();

  await page.getByRole('button', { name: /나의 세계도감/ }).tap();
  result.cardVisible = await page.getByRole('button', { name: /대한민국/ }).isVisible();
  result.progress = await page.locator('#progressText').textContent();
  await page.reload();
  result.persistedProgress = await page.locator('#progressText').textContent();

  await page.getByRole('button', { name: /지구본 탐험/ }).tap();
  const beforeRotate = await page.locator('[data-country="kr"]').boundingBox();
  await page.getByRole('button', { name: '지구본을 오른쪽으로 돌리기' }).tap();
  const afterRotate = await page.locator('[data-country="kr"]').boundingBox();
  result.rotationMovedMarker = Math.abs(beforeRotate.x - afterRotate.x) > 10;

  await page.getByRole('button', { name: '보호자 설정' }).tap();
  await page.locator('#guardianAnswer').fill('12');
  await page.getByRole('button', { name: '기록 모두 지우기' }).tap();
  result.guardianGateMessage = await page.locator('#guardianError').textContent();
  await page.locator('#guardianAnswer').fill('13');
  await page.getByRole('button', { name: '기록 모두 지우기' }).tap();
  result.resetProgress = await page.locator('#progressText').textContent();
  return result;
}
