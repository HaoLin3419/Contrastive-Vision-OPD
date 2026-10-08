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

const player = document.querySelector(".method-player");
const tabs = [...player.querySelectorAll('[role="tab"]')];
const play = player.querySelector(".play-button");
const panel = player.querySelector(".stage-detail");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const stages = [
  {
    title: "The student starts with the full image.",
    description: "It samples its own responses. Keep a training example when at least one rollout is correct; incorrect rollouts of that retained example are still available for correction.",
    reference: "Eq. 6, 13",
  },
  {
    title: "Hold the prefix fixed. Change only the crop.",
    description: "The positive teacher sees the shirt; the negative teacher sees unrelated ground. Both share parameters and score the same student prefix, so their distributions expose the effect of the visual input.",
    reference: "Eq. 7–8",
  },
  {
    title: "Select tokens using student–positive discrepancy.",
    description: "DAG compares each token's full-vocabulary JSD between the student and positive teacher with the retained batch's mean. Only above-mean positions receive the additional contrastive loss.",
    reference: "Eq. 12–13",
  },
  {
    title: "Pull toward relevant evidence. Push away from irrelevant evidence.",
    description: "CDL minimizes max(0, μ + d⁺ − d⁻). It moves the student closer to the positive distribution relative to the negative one, and stops pushing once the margin is satisfied.",
    reference: "Eq. 9",
  },
  {
    title: "Update the student, then refresh the shared teacher.",
    description: "Combine positive-teacher JSD with gated CDL to update θ. An exponential moving average updates the shared teacher parameters ϕ. At inference, the student still receives only the full image and question.",
    reference: "Eq. 14 / Alg. 1",
  },
];
let currentStage = 0;
let paused = motionPreference.matches;
let visible = false;
let timer;
const duration = 8500;

function resetProgress() {
  const progress = player.querySelector(".playback-track > span");
  progress.style.animation = "none";
  void progress.offsetWidth;
  progress.style.animation = "";
}

function schedule() {
  window.clearTimeout(timer);
  const stopped = paused || !visible || document.hidden;
  player.classList.toggle("is-paused", stopped);
  if (!stopped) timer = window.setTimeout(() => setStage(currentStage + 1), duration);
}

function setStage(index, userInitiated = false) {
  currentStage = (index + stages.length) % stages.length;
  player.dataset.step = String(currentStage);
  const stage = stages[currentStage];
  tabs.forEach((tab, i) => {
    tab.setAttribute("aria-selected", String(i === currentStage));
    tab.tabIndex = i === currentStage ? 0 : -1;
  });
  panel.setAttribute("aria-labelledby", `step-${currentStage}`);
  panel.querySelector(".stage-index").textContent = `0${currentStage + 1} / 05`;
  panel.querySelector(".stage-title").textContent = stage.title;
  panel.querySelector(".stage-description").textContent = stage.description;
  panel.querySelector(".stage-reference").textContent = stage.reference;
  if (userInitiated) paused = true;
  updatePlayButton();
  resetProgress();
  schedule();
}

function updatePlayButton() {
  const label = paused ? "Play animation" : "Pause animation";
  play.setAttribute("aria-label", label);
  play.title = label;
  play.innerHTML = `<i data-lucide="${paused ? "play" : "pause"}"></i>`;
  iconRefresh();
}

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
wireTabs(tabs, (index) => setStage(index, true));
play.addEventListener("click", () => {
  paused = !paused;
  updatePlayButton();
  resetProgress();
  schedule();
});
player.querySelector(".restart-button").addEventListener("click", () => {
  paused = motionPreference.matches;
  setStage(0);
});
motionPreference.addEventListener("change", (event) => {
  paused = event.matches;
  updatePlayButton();
  schedule();
});
document.addEventListener("visibilitychange", schedule);
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    resetProgress();
    schedule();
  }, { threshold: 0.15 }).observe(player);
} else {
  visible = true;
}
setStage(0);

const cases = [
  {
    image: "paper_assets/cvopd-figure-4-complete.png",
    caption: "Figure 4 · Lock attention comparison",
    source: "Figure 4 · Appendix A.4, p. 15",
    kicker: "Evidence present",
    title: "The lock is silver. The mailbox is red.",
    description: "Vision-OPD follows the mailbox's dominant red color. CV-OPD focuses on the lock itself and identifies its metallic silver color.",
    takeaway: "The relevant object, not the surrounding color, should determine the answer.",
    caveat: "A qualitative example of attention and response behavior, not a causal proof of grounding.",
    alt: "Figure 4: Vision-OPD predicts the mailbox's dominant red; CV-OPD attends to the lock and predicts silver.",
  },
  {
    image: "paper_assets/cvopd-figure-5-complete.png",
    caption: "Figure 5 · Black-mask attention comparison",
    source: "Figure 5 · Appendix A.5, p. 15",
    kicker: "Evidence removed",
    title: "The expected answer survives the mask.",
    description: "Vision-OPD describes the hidden children and predicts the expected spatial relation. CV-OPD instead notes that the requested children are not visible and describes the remaining person.",
    takeaway: "Naming the expected answer is not enough when the evidence needed to support it has been removed.",
    caveat: "CV-OPD still supplies a forced-choice answer. This example illustrates a change in reasoning, not guaranteed abstention or correctness.",
    alt: "Figure 5: the target children are black-masked. Vision-OPD answers left; CV-OPD describes visible evidence and answers right.",
  },
  {
    image: "paper_assets/cvopd-figure-6-complete.png",
    caption: "Figure 6 · Umbrella under a black mask",
    source: "Figure 6 · Appendix, p. 16",
    kicker: "Color evidence unavailable",
    title: "Uncertainty is visible in the response.",
    description: "With the umbrella obscured, CV-OPD explicitly says that there is little usable color information. It then selects white under the required multiple-choice format.",
    takeaway: "Acknowledging missing visual evidence and choosing the correct option are different outcomes.",
    caveat: "The paper reports that this forced-choice prediction is incorrect. The example is not presented as an accuracy success.",
    alt: "Figure 6: original and black-masked umbrella images, with a CV-OPD response acknowledging unreliable color information and an incorrect white prediction.",
  },
  {
    image: "paper_assets/cvopd-figure-7-complete.png",
    caption: "Figure 7 · Glove under Gaussian noise",
    source: "Figure 7 · Appendix, p. 16",
    kicker: "Texture evidence corrupted",
    title: "The material cannot be reliably identified.",
    description: "When Gaussian noise hides the glove's texture, CV-OPD recognizes that the visual information is insufficient to distinguish the materials. It still selects leather when forced to choose.",
    takeaway: "The response should distinguish observed texture from an unsupported guess.",
    caveat: "The paper reports that this final choice is incorrect, despite the model acknowledging the lack of reliable evidence.",
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
  ["source", "kicker", "title", "description", "takeaway", "caveat"].forEach((field) => {
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
    document.body.style.overflow = "hidden";
  });
});
dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener("close", () => { document.body.style.overflow = ""; });
