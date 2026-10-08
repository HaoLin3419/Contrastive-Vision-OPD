const { chromium } = require("../.tmp/site-tools/node_modules/@playwright/test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const output = path.join(root, ".tmp/website-checks");
const prefix = "/Contrastive-Vision-OPD/";
const expectedResults = [
  ["82.20", "48.40", "86.38", "82.00", "63.94", "63.80", "71.12"],
  ["81.68", "56.57", "76.75", "75.62", "71.10", "68.58", "71.72"],
  ["91.62", "60.12", "85.13", "83.38", "76.98", "71.44", "78.11"],
  ["86.91", "60.36", "81.62", "78.12", "73.29", "67.42", "74.62"],
  ["88.48", "56.45", "84.88", "78.75", "73.49", "70.45", "75.42"],
  ["89.53", "59.41", "81.75", "80.12", "74.51", "70.17", "75.92"],
  ["89.80", "58.70", "82.60", "79.50", "73.80", "67.82", "75.37"],
  ["91.62", "62.01", "84.38", "83.38", "76.99", "70.93", "78.22"],
];
const expectedAblations = [
  ["75.92", "76.81", "76.88", "78.22"],
  ["71.12", "76.76", "77.20", "76.40", "78.22"],
  ["76.88", "77.08", "78.22"],
];

async function decodeImages(page) {
  await page.locator("img[src]").evaluateAll((images) => Promise.all(
    images.map((image) => {
      image.loading = "eager";
      return image.decode();
    }),
  ));
}

async function checkLayout(page, label) {
  const issues = await page.evaluate(() => {
    const failures = [];
    if (document.documentElement.scrollWidth > innerWidth) failures.push("Page overflow");
    const selectors = [
      "h1", "h2", "h3", "h4", ".button", ".component-heading", ".equation",
      ".input-branch", ".case-tabs button", ".citation-toolbar", ".nav-links",
      ".mechanism-path", ".technical-demo", ".gate-summary", ".sample-result",
      ".token-column", ".rollout-grid li", ".case-copy", ".objective-content",
    ];
    for (const node of document.querySelectorAll(selectors.join(","))) {
      if (!node.getClientRects().length) continue;
      if (node.scrollWidth > node.clientWidth + 2) {
        failures.push(`Content overflow: ${node.className || node.tagName}`);
      }
    }
    const intersects = (a, b) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    for (const selector of [
      ".header-inner", ".paper-actions", ".section-heading", ".input-comparison",
      ".loss-components", ".ablation-grid", ".case-tabs", ".case-panel",
      ".citation-toolbar", ".dialog-toolbar",
      ".mechanism-grid", ".demo-grid", ".ablation-detail-grid", ".demo-heading",
      ".gate-summary", ".rollout-grid", ".sample-options",
    ]) {
      for (const parent of document.querySelectorAll(selector)) {
        const children = [...parent.children].filter((child) => child.getClientRects().length);
        for (let i = 0; i < children.length; i++) {
          for (let j = i + 1; j < children.length; j++) {
            if (intersects(children[i].getBoundingClientRect(), children[j].getBoundingClientRect())) {
              failures.push(`Overlapping children: ${selector}`);
            }
          }
        }
      }
    }
    for (const image of document.querySelectorAll("img[src]")) {
      if (!image.naturalWidth) failures.push(`Broken image: ${image.getAttribute("src")}`);
    }
    return failures;
  });
  assert.deepEqual(issues, [], label);
}

async function setRange(page, id, value) {
  await page.locator(`#${id}`).fill(String(value));
  await page.locator(`#${id}`).dispatchEvent("input");
}

async function checkExplanations(page, width, output) {
  assert.equal(await page.locator(".mechanism-column").count(), 2);
  assert.equal(await page.locator("#cdl-loss").textContent(), "0.20");
  for (const [positive, negative, margin, expected, satisfied] of [
    [0.30, 0.40, 0.10, "0.00", "true"],
    [0.30, 0.39, 0.10, "0.01", "false"],
    [0, 0.69, 0.01, "0.00", "true"],
    [0.69, 0, 0.69, "1.38", "false"],
  ]) {
    await setRange(page, "cdl-positive", positive);
    await setRange(page, "cdl-negative", negative);
    await setRange(page, "cdl-margin", margin);
    assert.equal(await page.locator("#cdl-loss").textContent(), expected);
    assert.equal(await page.locator("#cdl-state").getAttribute("data-satisfied"), satisfied);
    await checkLayout(page, `CDL boundary state at ${width}`);
  }
  await setRange(page, "cdl-positive", 0.30);
  await setRange(page, "cdl-negative", 0.20);
  await setRange(page, "cdl-margin", 0.10);
  await page.locator("#cdl-margin").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator("#cdl-margin-value").textContent(), "0.11");
  assert.equal(await page.locator("#cdl-loss").textContent(), "0.21");
  await setRange(page, "cdl-margin", 0.10);

  for (const [threshold, count] of [[0, 7], [0.18, 2], [0.44, 1], [0.56, 0], [0.69, 0]]) {
    await setRange(page, "dag-threshold", threshold);
    assert.equal(await page.locator(".token-column.is-selected").count(), count);
    assert.equal(await page.locator("#dag-count").textContent(), `${count} / 7 pass the token gate`);
    assert.equal(await page.locator(".token-column[data-discrepancy='0.18']").evaluate((node) =>
      node.classList.contains("is-selected")), threshold < 0.18);
    assert.match(await page.locator(".token-chart").getAttribute("aria-label"),
      new RegExp(`threshold ${threshold.toFixed(2)}`));
  }
  await setRange(page, "dag-threshold", 0.25);
  await page.locator("[name='sample-case'][value='filtered']").check();
  assert.equal(await page.locator(".rollout-grid .is-correct").count(), 0);
  assert.match(await page.locator("#sample-effect").textContent(), /Both JSD and CDL are disabled/);
  assert.equal(await page.locator(".token-column.is-selected").count(), 2,
    "The sample gate should not change the token-level comparison");
  await checkLayout(page, `Filtered sample at ${width}`);
  await page.locator("[name='sample-case'][value='retained']").check();
  assert.equal(await page.locator(".rollout-grid .is-correct").count(), 1);
  assert.match(await page.locator("#sample-effect").textContent(), /2 of the 7/);

  for (const selector of ["#negative-ablation", "#gate-ablation", ".objective-details"]) {
    const disclosure = page.locator(selector);
    await disclosure.locator("summary").focus();
    await page.keyboard.press("Enter");
    assert.equal(await disclosure.evaluate((node) => node.open), true);
    await checkLayout(page, `Expanded ${selector} at ${width}`);
    await disclosure.screenshot({ path: path.join(output, `${selector.replace(/[#.]/g, "")}-${width}.png`) });
    await disclosure.locator("summary").press("Enter");
    assert.equal(await disclosure.evaluate((node) => node.open), false);
  }
  assert.deepEqual(await page.locator("#negative-strategy-table tbody tr").evaluateAll((rows) =>
    rows.map((row) => [...row.querySelectorAll("td")].map((cell) => cell.textContent))),
  [["76.76", "1.46"], ["76.40", "1.82"], ["77.20", "1.02"], ["78.22", "0.00"]]);
  assert.deepEqual(await page.locator("#gate-strategy-table tbody tr td").allTextContents(),
    ["76.88", "77.08", "78.22"]);
  await page.locator("#comparison").screenshot({ path: path.join(output, `comparison-${width}.png`) });
  await page.locator("#cdl-demo").screenshot({ path: path.join(output, `cdl-${width}.png`) });
  await page.locator("#dag-demo").screenshot({ path: path.join(output, `dag-${width}.png`) });
}

function serveProject() {
  const mime = {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".png": "image/png",
    ".jpg": "image/jpeg", ".pdf": "application/pdf", ".bib": "text/plain",
  };
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(prefix)) {
      response.writeHead(404).end();
      return;
    }
    const file = path.resolve(root, pathname.slice(prefix.length) || "index.html");
    if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(response);
  });
  return server;
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const errors = [];
  const server = serveProject();
  try {
    const url = pathToFileURL(path.join(root, "index.html")).href;
    for (const width of [1920, 1440, 1280, 1024, 820, 768, 651, 650, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(url);
      await page.locator("svg.lucide").first().waitFor({ state: "attached" });
      await decodeImages(page);

      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(await page.locator(".method-player").count(), 0);
      assert.ok(await page.locator("#overview").evaluate((section) => section.offsetTop < innerHeight),
        "The first viewport should include research content");
      assert.deepEqual(await page.locator(".benchmark-table tbody tr").evaluateAll((rows) =>
        rows.map((row) => [...row.querySelectorAll("td")].map((cell) => cell.textContent.trim()))),
      expectedResults, "Table 1 must match the manuscript");
      assert.deepEqual(await page.locator(".compact-table tbody").evaluateAll((tables) =>
        tables.map((table) => [...table.rows].map((row) => row.cells[row.cells.length - 1].textContent.trim()))),
      expectedAblations, "Tables 2-4 must match the manuscript");
      const localLinks = await page.locator("[src], a[href], link[href]").evaluateAll((nodes) =>
        nodes.flatMap((node) => ["src", "href"].filter((attr) => node.hasAttribute(attr))
          .map((attr) => node.getAttribute(attr)))
          .filter((value) => !value.startsWith("https:")));
      for (const value of localLinks) {
        assert.ok(!value.startsWith("/"), `Domain-root path: ${value}`);
        if (value.startsWith("#")) {
          assert.equal(await page.locator(value).count(), 1, `Broken anchor: ${value}`);
        } else {
          assert.ok(fs.existsSync(path.resolve(root, value)), `Missing asset: ${value}`);
        }
      }
      assert.equal((await page.locator("#bibtex").textContent()).trim(),
        fs.readFileSync(path.join(root, "paper_assets/cvopd.bib"), "utf8").trim());
      await checkLayout(page, `Initial layout at ${width}`);
      await checkExplanations(page, width, output);
      await page.screenshot({ path: path.join(output, `page-${width}.png`), fullPage: true });
      await page.locator(".pipeline-figure").screenshot({ path: path.join(output, `method-${width}.png`) });

      // Clipboard fallback must work when permission is denied in local file previews.
      await page.evaluate(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: () => Promise.reject(new Error("Permission denied")) },
        });
      });
      await page.locator(".copy-citation").click();
      await page.waitForFunction(() => document.querySelector(".copy-status").textContent === "Copied");
      assert.equal(await page.locator(".clipboard-fallback").count(), 0);
      assert.equal(await page.locator("a[download='cvopd.bib']").getAttribute("href"), "./paper_assets/cvopd.bib");

      await page.locator(".paper-details summary").click();
      assert.equal(await page.locator(".paper-details").evaluate((details) => details.open), true);
      await decodeImages(page);
      for (const button of await page.locator("[data-figure]").all()) {
        await button.click();
        assert.equal(await page.locator(".figure-dialog").evaluate((dialog) => dialog.open), true);
        await page.locator(".dialog-image").evaluate((image) => image.decode());
        await checkLayout(page, `Open figure at ${width}`);
        await page.keyboard.press("Escape");
        assert.equal(await page.locator(".figure-dialog").evaluate((dialog) => dialog.open), false);
        assert.equal(await page.evaluate(() => document.body.style.overflow), "");
        assert.equal(await button.evaluate((element) => document.activeElement === element), true,
          "Closing a figure should restore focus to its trigger");
      }

      for (let index = 0; index < 4; index++) {
        await page.locator(`[data-case="${index}"]`).click();
        assert.equal(await page.locator(".case-panel").getAttribute("aria-labelledby"), `case-tab-${index}`);
        await page.locator(".case-image").evaluate((image) => image.decode());
        assert.match(await page.locator(".case-image").getAttribute("src"), new RegExp(`figure-${index + 4}`));
        assert.equal(await page.locator(".case-question").textContent(), [
          "What is the color of the lock?",
          "Is the kid with black shirt on the left or right side of the kid with blue shirt?",
          "What is the color of the umbrella?",
          "What is the material of the glove?",
        ][index]);
        assert.ok((await page.locator(".case-response-note").textContent()).length > 70);
        if (index >= 2) assert.match(await page.locator(".case-response-note").textContent(), /incorrect/);
        await checkLayout(page, `Case ${index} at ${width}`);
        await page.locator(".case-panel").screenshot({ path: path.join(output, `case-${index}-${width}.png`) });
        await page.locator(".case-figure").click();
        assert.match(await page.locator(".dialog-image").getAttribute("src"), new RegExp(`figure-${index + 4}`));
        await page.locator(".dialog-close").click();
      }
      await page.locator("[data-case='3']").focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(await page.locator("[data-case='0']").getAttribute("aria-selected"), "true");
      await page.keyboard.press("End");
      assert.equal(await page.locator("[data-case='3']").getAttribute("aria-selected"), "true");
      await page.keyboard.press("Home");
      assert.equal(await page.locator("[data-case='0']").getAttribute("aria-selected"), "true");
      if (width <= 650) {
        await page.locator(".menu-toggle").click();
        assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "true");
        await checkLayout(page, `Open mobile navigation at ${width}`);
        await page.locator(".nav-links a[href='#comparison']").click();
        assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "false");
        await page.locator(".menu-toggle").click();
        await page.keyboard.press("Escape");
        assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "false");
      }
      assert.equal(await page.evaluate(() => document.getAnimations().length), 0,
        "No continuing page animations");
      console.log(`PASS ${width}px: layout, paper tables, CDL boundaries, strict DAG, sample filtering, disclosures, cases, keyboard, original features`);
      await page.close();
    }

    // Serve the unchanged static files beneath the same subpath used by GitHub Pages.
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();
    const badResponses = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(`${origin}${prefix}`);
    await decodeImages(page);
    await page.locator(".copy-citation").click();
    await page.waitForFunction(() => document.querySelector(".copy-status").textContent === "Copied");
    assert.equal(
      (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n"),
      await page.locator("#bibtex").textContent(),
    );
    const downloadPromise = page.waitForEvent("download");
    await page.locator("a[download='cvopd.bib']").click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "cvopd.bib");
    assert.equal(await download.failure(), null);
    for (const asset of [
      "styles.css", "script.js", "CV_OPD_Contrastive_Vision_OPD_ICLR_27.pdf",
      "paper_assets/cvopd.bib", "paper_assets/lucide-LICENSE.txt",
    ]) {
      const response = await context.request.get(`${origin}${prefix}${asset}`);
      assert.equal(response.status(), 200, asset);
    }
    assert.deepEqual(badResponses, []);
    assert.deepEqual(errors, []);
    console.log("PASS project-subpath serving and Clipboard API; no JavaScript errors");
    const noScript = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    await noScript.goto(url);
    assert.equal(await noScript.locator("noscript a").count(), 3);
    assert.equal(await noScript.locator(".benchmark-table tbody tr").count(), 8);
    assert.equal(await noScript.locator("#cdl-positive").isDisabled(), true);
    assert.equal(await noScript.locator("#dag-threshold").isDisabled(), true);
    console.log("PASS research content and additional figure links remain available without JavaScript");
  } finally {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
