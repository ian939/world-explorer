async (page) => {
  await page.goto("http://127.0.0.1:4173");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector(".globe-pin");

  const result = {};
  result.viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  result.bodyUserSelect = await page.locator("body").evaluate(element => getComputedStyle(element).userSelect);
  result.globeTouchAction = await page.locator("#globeWrap").evaluate(element => getComputedStyle(element).touchAction);
  result.webglCanvasCount = await page.locator("#globeCanvas canvas").count();
  result.pinCount = await page.locator(".globe-pin").count();
  result.pinSize = await page.locator('[data-country="kr"]').evaluate(element => {
    const box = element.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });

  await page.locator('[data-country="kr"]').click({ force: true });
  result.dialogCountry = await page.locator("#dialogTitle").textContent();
  await page.getByRole("button", { name: "탐험 미션 시작" }).click();
  await page.getByRole("button", { name: "안녕하세요" }).click();
  result.success = await page.locator("#dialogTitle").textContent();
  await page.getByRole("button", { name: "다음 나라 찾기" }).click();

  await page.getByRole("button", { name: /나의 세계도감/ }).click();
  result.cardVisible = await page.locator('[data-open-country="kr"]').isVisible();
  result.progress = await page.locator("#progressText").textContent();
  await page.reload();
  result.persistedProgress = await page.locator("#progressText").textContent();

  await page.getByRole("button", { name: /지구본 탐험/ }).click();
  await page.getByRole("button", { name: "보호자 설정" }).click();
  await page.locator("#guardianAnswer").fill("12");
  await page.getByRole("button", { name: "기록 모두 지우기" }).click();
  result.guardianGateMessage = await page.locator("#guardianError").textContent();
  await page.locator("#guardianAnswer").fill("13");
  await page.getByRole("button", { name: "기록 모두 지우기" }).click();
  result.resetProgress = await page.locator("#progressText").textContent();
  return result;
}
