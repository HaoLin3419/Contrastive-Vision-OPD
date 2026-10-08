const { chromium } = require("../.tmp/site-tools/node_modules/@playwright/test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const fs = require("node:fs");

(async () => {
  const output = path.resolve(__dirname, "../.tmp/website-checks");
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const errors = [];
  const url = pathToFileURL(path.resolve(__dirname, "../index.html")).href;
  for (const width of [1440, 1920, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    await page.locator("svg.lucide").first().waitFor({ state: "attached" });
    await page.evaluate(() => Promise.all([...document.images].map((image) => {
      image.loading = "eager";
      return image.decode().catch(() => {});
    })));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Page overflow at ${width}`);
    const broken = await page.locator("img[src]").evaluateAll((images) => images.filter((image) => !image.naturalWidth).map((image) => image.src));
    assert.deepEqual(broken, [], `Broken images at ${width}`);
    await page.screenshot({ path: path.join(output, `page-${width}.png`), fullPage: true });

    const player = page.locator(".method-player");
    await player.scrollIntoViewIfNeeded();
    for (let step = 0; step < 5; step++) {
      await page.locator(`.step-tabs [data-step="${step}"]`).click();
      assert.equal(await player.getAttribute("data-step"), String(step));
      assert.equal(await page.locator(".play-button").getAttribute("aria-label"), "Play animation");
      assert.equal(await page.locator(".stage-detail").getAttribute("aria-labelledby"), `step-${step}`);
    }
    await page.locator(".step-tabs [data-step='4']").press("ArrowRight");
    assert.equal(await player.getAttribute("data-step"), "0");
    await player.screenshot({ path: path.join(output, `method-${width}.png`) });

    const collisions = await page.evaluate(() => {
      const failures = [];
      const get = (s) => document.querySelector(s).getBoundingClientRect();
      const intersects = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
      const groups = [
        [".player-top h3", ".player-controls"],
        [".student-input", ".student-policy", ".student-tokens", ".objectives"],
        [".positive-input", ".positive-policy", ".positive-tokens"],
        [".negative-input", ".negative-policy", ".negative-tokens"],
        [".sample-gate", ".shared-prefix", ".ema-loop"],
        [".stage-index", ".stage-title", ".stage-reference"],
      ];
      for (const group of groups) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            if (intersects(get(group[i]), get(group[j]))) failures.push(`${group[i]} overlaps ${group[j]}`);
          }
        }
      }
      for (const node of document.querySelectorAll(".policy,.objective,.token-row,.stage-detail,.step-tabs button,.case-tabs button")) {
        if (node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2) failures.push(`Content overflow: ${node.className || node.textContent}`);
      }
      return failures;
    });
    assert.deepEqual(collisions, [], `Layout issues at ${width}`);

    for (let index = 0; index < 4; index++) {
      await page.locator(`[data-case="${index}"]`).click();
      assert.equal(await page.locator(".case-panel").getAttribute("aria-labelledby"), `case-tab-${index}`);
      await page.locator(".case-image").evaluate((image) => image.decode());
      assert.match(await page.locator(".case-image").getAttribute("src"), new RegExp(`figure-${index + 4}`));
    }
    await page.locator(".case-figure").click();
    assert.equal(await page.locator(".figure-dialog").evaluate((dialog) => dialog.open), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".figure-dialog").evaluate((dialog) => dialog.open), false);
    await page.locator(".paper-details summary").click();
    assert.equal(await page.locator(".paper-details").evaluate((details) => details.open), true);
    if (width < 760) {
      await page.locator(".menu-toggle").click();
      assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "true");
      await page.locator(".nav-links a[href='#method']").click();
      assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "false");
    }
    console.log(`PASS ${width}px: assets, overflow, diagram layout, five stages, keyboard, case tabs, dialog, paper figure`);
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(url);
  await page.locator(".method-player").scrollIntoViewIfNeeded();
  await page.locator(".restart-button").click();
  await page.waitForTimeout(8800);
  assert.equal(await page.locator(".method-player").getAttribute("data-step"), "1", "Autoplay should advance");
  await page.locator(".play-button").click();
  await page.waitForTimeout(8800);
  assert.equal(await page.locator(".method-player").getAttribute("data-step"), "1", "Pause should hold");
  await page.locator(".step-tabs [data-step='3']").click();
  await page.locator(".play-button").click();
  const dot = page.locator(".dist-student");
  const initialX = (await dot.boundingBox()).x;
  await page.waitForTimeout(2200);
  const movedX = (await dot.boundingBox()).x;
  assert.ok(initialX - movedX > 10, "CDL student distribution must move toward positive teacher");
  await page.locator(".method-player").screenshot({ path: path.join(output, "method-cdl-moving.png") });
  await page.locator(".play-button").click();
  const pausedX = (await dot.boundingBox()).x;
  await page.waitForTimeout(600);
  assert.ok(Math.abs((await dot.boundingBox()).x - pausedX) < 1, "Pause must freeze the distribution animation");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  assert.equal(await page.locator(".play-button").getAttribute("aria-label"), "Play animation");
  assert.deepEqual(errors, []);
  await browser.close();
  console.log("PASS autoplay, pause, animated CDL displacement, animation freeze, reduced motion; no JavaScript errors");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
