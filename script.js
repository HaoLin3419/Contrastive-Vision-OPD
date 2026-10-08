const iconRefresh = () => window.lucide?.createIcons();
iconRefresh();

const header = document.querySelector(".site-header");
const menu = document.querySelector(".menu-toggle");
const closeMenu = () => {
  header.classList.remove("menu-open");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open navigation");
  menu.title = "Open navigation";
};
menu.addEventListener("click", () => {
  const open = header.classList.toggle("menu-open");
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  menu.title = open ? "Close navigation" : "Open navigation";
});
document.querySelectorAll(".nav-links a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

function wireTabs(buttons, select) {
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => select(index));
    button.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
      if (event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      buttons[next].focus();
      select(next);
    });
  });
}

const cdlInputs = ["positive", "negative", "margin"].map((name) =>
  document.querySelector(`#cdl-${name}`));
function updateCDL() {
  // Integer slider steps keep equality at the margin free of rounding errors.
  const [positive, negative, margin] = cdlInputs.map((input) => Math.round(Number(input.value) * 100));
  const loss = Math.max(0, margin + positive - negative);
  const format = (value) => (value / 100).toFixed(2);
  cdlInputs.forEach((input) => {
    document.querySelector(`#${input.id}-value`).textContent = Number(input.value).toFixed(2);
  });
  for (const [name, value] of [["positive", positive], ["negative", negative]]) {
    document.querySelector(`#${name}-distance-label`).textContent = format(value);
    document.querySelector(`#${name}-distance-bar`).style.width = `${value / 100 / Math.LN2 * 100}%`;
  }
  document.querySelector("#cdl-loss").textContent = format(loss);
  const status = document.querySelector("#cdl-state");
  status.dataset.satisfied = String(loss === 0);
  status.textContent = loss === 0 ? "Margin Satisfied" : "Margin Violated";
  document.querySelector("#cdl-condition").textContent =
    `d− − d+ = ${format(negative - positive)} ${loss === 0 ? "≥" : "<"} μ = ${format(margin)}`;
  document.querySelector("#cdl-explanation").textContent = loss === 0
    ? "No CDL penalty remains at this position. Positive-teacher JSD can still apply to a retained sample."
    : "A contrastive penalty remains. This readout is before sample and token gating.";
}
cdlInputs.forEach((input) => input.addEventListener("input", updateCDL));
document.querySelector("#cdl-demo fieldset").disabled = false;
updateCDL();

const thresholdInput = document.querySelector("#dag-threshold");
const tokenColumns = [...document.querySelectorAll(".token-column")];
const sampleOptions = [...document.querySelectorAll('[name="sample-case"]')];
function updateDAG() {
  const threshold = Math.round(Number(thresholdInput.value) * 100);
  const retained = document.querySelector('[name="sample-case"]:checked').value === "retained";
  let selected = 0;
  const descriptions = [];
  tokenColumns.forEach((column) => {
    const discrepancy = Math.round(Number(column.dataset.discrepancy) * 100);
    const passes = discrepancy > threshold;
    selected += Number(passes);
    column.classList.toggle("is-selected", passes);
    column.querySelector(".token-state").textContent = passes ? "Pass" : "Skip";
    column.querySelector(".token-bar").style.height = `${discrepancy / Math.LN2}%`;
    descriptions.push(`${column.querySelector(".token-word").textContent}: ${(discrepancy / 100).toFixed(2)}, ${passes ? "passes" : "does not pass"}`);
  });
  document.querySelector("#dag-threshold-value").textContent = (threshold / 100).toFixed(2);
  document.querySelector(".threshold-line").style.bottom = `${threshold / Math.LN2}%`;
  document.querySelector("#dag-count").textContent = `${selected} / ${tokenColumns.length} pass the token gate`;
  document.querySelector(".token-chart").setAttribute("aria-label",
    `Illustrative token discrepancies. Simulated threshold ${(threshold / 100).toFixed(2)}, strict greater-than gate. ${descriptions.join("; ")}.`);
  document.querySelectorAll(".rollout-grid li").forEach((rollout, index) => {
    const correct = retained && index === 2;
    rollout.classList.toggle("is-correct", correct);
    rollout.querySelector("strong").textContent = correct ? "Correct" : "Incorrect";
  });
  document.querySelector("#sample-status").textContent = retained ? "Sample retained · b = 1" : "Sample filtered · b = 0";
  document.querySelector("#sample-effect").textContent = retained
    ? `JSD remains active; ${selected} of the ${tokenColumns.length} illustrative positions are eligible for CDL, subject to the margin.`
    : "Both JSD and CDL are disabled for this sample. No positions contribute, regardless of the token gate.";
}
thresholdInput.addEventListener("input", updateDAG);
sampleOptions.forEach((input) => input.addEventListener("change", updateDAG));
document.querySelectorAll("#dag-demo fieldset").forEach((fieldset) => { fieldset.disabled = false; });
updateDAG();

const cases = [
  {
    image: "paper_assets/cvopd-figure-4-complete.png",
    caption: "Figure 4 · Lock attention comparison",
    source: "Figure 4 · Appendix A.4, p. 15",
    kicker: "Evidence present",
    title: "Lock-color identification",
    "input-note": "Evidence present: the original mailbox image and both models' attention visualizations. The lock is the relevant object; the surrounding red mailbox is a potential distractor.",
    question: "What is the color of the lock?",
    choices: "(A) yellow · (B) silver · (C) golden · (D) red",
    "response-note": "Vision-OPD: (D) red. CV-OPD: (B) silver. The complete recorded responses and attention maps are reproduced in the figure.",
    description: "Vision-OPD's red prediction matches the surrounding mailbox, while CV-OPD's silver prediction matches the lock.",
    takeaway: "The attention maps are consistent with this difference in the referenced visual regions.",
    caveat: "Attention is supporting evidence, not a sufficient causal proof of grounding.",
    alt: "Figure 4: Vision-OPD predicts the mailbox's dominant red; CV-OPD attends to the lock and predicts silver.",
  },
  {
    image: "paper_assets/cvopd-figure-5-complete.png",
    caption: "Figure 5 · Black-mask attention comparison",
    source: "Figure 5 · Appendix A.5, p. 15",
    kicker: "Evidence removed",
    title: "The expected answer survives the mask.",
    "input-note": "Evidence missing: the answer-relevant children are hidden by a black mask. Figure 5 records both models under this condition, not a paired set of original-input responses.",
    question: "Is the kid with black shirt on the left or right side of the kid with blue shirt?",
    choices: "(A) right · (B) left",
    "response-note": "Vision-OPD: (B) left. CV-OPD: (A) right. The figure preserves each model's complete recorded response to the masked input.",
    description: "Vision-OPD describes children hidden by the mask and gives the expected relation; CV-OPD notes that those children are not visible and describes the remaining person.",
    takeaway: "Matching the expected answer is not evidence of grounding when its visual support has been removed.",
    caveat: "CV-OPD still makes a forced choice; this case does not demonstrate guaranteed abstention or correctness.",
    alt: "Figure 5: the target children are black-masked. Vision-OPD answers left; CV-OPD describes visible evidence and answers right.",
  },
  {
    image: "paper_assets/cvopd-figure-6-complete.png",
    caption: "Figure 6 · Umbrella under a black mask",
    source: "Figure 6 · Appendix, p. 16",
    kicker: "Color evidence unavailable",
    title: "Uncertainty is visible in the response.",
    "input-note": "Evidence present and missing: the original and black-mask images are both reproduced in Figure 6. Only the response to the masked input is reported here.",
    question: "What is the color of the umbrella?",
    choices: "(A) red · (B) blue · (C) black · (D) white",
    "response-note": "CV-OPD: (D) white, incorrect according to the figure caption. Figure 6 does not provide a Vision-OPD response or a CV-OPD original-input response for this comparison.",
    description: "With the umbrella obscured, CV-OPD explicitly acknowledges that little usable color information remains.",
    takeaway: "Its forced-choice white prediction is nevertheless incorrect, separating recognition of missing evidence from answer accuracy.",
    caveat: "This example is not evidence of successful abstention or a general accuracy improvement.",
    alt: "Figure 6: original and black-masked umbrella images, with a CV-OPD response acknowledging unreliable color information and an incorrect white prediction.",
  },
  {
    image: "paper_assets/cvopd-figure-7-complete.png",
    caption: "Figure 7 · Glove under Gaussian noise",
    source: "Figure 7 · Appendix, p. 16",
    kicker: "Texture evidence corrupted",
    title: "The material cannot be reliably identified.",
    "input-note": "Evidence present and corrupted: Figure 7 pairs the original image with Gaussian noise over the relevant region. The recorded response is for the corrupted input only.",
    question: "What is the material of the glove?",
    choices: "(A) rubber · (B) cotton · (C) kevlar · (D) leather",
    "response-note": "CV-OPD: (D) leather, incorrect according to the figure caption. Figure 7 provides no Vision-OPD or original-input response to complete a two-model, two-condition comparison.",
    description: "When noise obscures the glove's texture, CV-OPD acknowledges insufficient evidence to identify the material.",
    takeaway: "It still selects leather under the required answer format, and the paper labels this choice incorrect.",
    caveat: "Acknowledging uncertainty is not equivalent to making a grounded or correct final choice.",
    alt: "Figure 7: original and Gaussian-noise glove images, with a response admitting unreliable material evidence and an incorrect leather prediction.",
  },
];
const caseTabs = [...document.querySelectorAll("[data-case]")];
const casePanel = document.querySelector(".case-panel");
wireTabs(caseTabs, (index) => {
  const item = cases[index];
  caseTabs.forEach((tab, i) => {
    tab.setAttribute("aria-selected", String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
  });
  casePanel.setAttribute("aria-labelledby", `case-tab-${index}`);
  const image = casePanel.querySelector(".case-image");
  image.src = item.image;
  image.alt = item.alt;
  const button = casePanel.querySelector(".case-figure");
  button.dataset.figure = item.image;
  button.dataset.caption = item.caption;
  ["source", "kicker", "title", "input-note", "question", "choices", "response-note", "description", "takeaway", "caveat"].forEach((field) => {
    casePanel.querySelector(`.case-${field}`).textContent = item[field];
  });
});

const dialog = document.querySelector(".figure-dialog");
document.querySelectorAll("[data-figure]").forEach((button) => {
  button.addEventListener("click", () => {
    dialog.querySelector(".dialog-image").src = button.dataset.figure;
    dialog.querySelector(".dialog-image").alt = button.querySelector("img").alt;
    dialog.querySelector(".dialog-caption").textContent = button.dataset.caption;
    dialog.querySelector(".dialog-original").href = button.dataset.figure;
    dialog.showModal();
  });
});
dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
const copyButton = document.querySelector(".copy-citation");
const copyStatus = document.querySelector(".copy-status");
copyButton.addEventListener("click", async () => {
  const citation = document.querySelector("#bibtex").textContent;
  let copied = false;
  copyButton.disabled = true;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(citation);
      copied = true;
    }
  } catch {
    // Local file previews and restricted browsers may deny Clipboard API access.
  }
  if (!copied) {
    const textarea = document.createElement("textarea");
    textarea.value = citation;
    textarea.className = "clipboard-fallback";
    textarea.setAttribute("aria-label", "BibTeX citation");
    document.body.append(textarea);
    textarea.select();
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    } finally {
      textarea.remove();
    }
  }
  copyButton.disabled = false;
  copyButton.focus({ preventScroll: true });
  copyStatus.textContent = copied ? "Copied" : "Copy unavailable. Use the download link.";
});
