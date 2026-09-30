const menuToggle = document.querySelector(".menu-toggle");
const header = document.querySelector(".site-header");

if (menuToggle && header) {
  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const pipelineDemo = document.querySelector(".pipeline-demo");

if (pipelineDemo) {
  const playButton = pipelineDemo.querySelector(".diagram-play");
  const restartButton = pipelineDemo.querySelector(".diagram-restart");
  const stepButtons = [...pipelineDemo.querySelectorAll("[data-go-step]")];
  const storyCards = [...document.querySelectorAll(".story-card[data-story-step]")];
  const stepCount = pipelineDemo.querySelector(".step-count");
  const stepTitle = pipelineDemo.querySelector(".step-title");
  const stepDescription = pipelineDemo.querySelector(".step-description");
  const steps = [
    {
      title: "Sample on-policy trajectories",
      description:
        "The student samples multiple on-policy responses from the full image. A training sample is retained when at least one rollout is correct.",
    },
    {
      title: "Contrast positive and negative evidence",
      description:
        "The teacher branches share parameters and the same student prefix. They differ only in the privileged crop: answer-related R+ versus unrelated R−.",
    },
    {
      title: "Update the grounded policy",
      description:
        "Positive-teacher JSD and the discrepancy-gated contrastive divergence loss update the student, while EMA refreshes the teacher parameters.",
    },
  ];
  let activeStep = 0;
  let isPaused = false;
  let intervalId;

  const setStep = (step) => {
    activeStep = (step + steps.length) % steps.length;
    pipelineDemo.dataset.step = String(activeStep);
    stepCount.textContent = `STEP ${activeStep + 1} / ${steps.length}`;
    stepTitle.textContent = steps[activeStep].title;
    stepDescription.textContent = steps[activeStep].description;

    stepButtons.forEach((button, index) => {
      const isActive = index === activeStep;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    storyCards.forEach((card) => {
      card.classList.toggle("is-active", Number(card.dataset.storyStep) === activeStep);
    });

  };

  const startPlayback = () => {
    window.clearInterval(intervalId);
    intervalId = window.setInterval(() => setStep(activeStep + 1), 6200);
  };

  const setPaused = (paused) => {
    isPaused = paused;
    pipelineDemo.classList.toggle("is-paused", paused);
    playButton.textContent = paused ? "▶" : "Ⅱ";
    playButton.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
    playButton.title = paused ? "Play animation" : "Pause animation";

    if (paused) window.clearInterval(intervalId);
    else startPlayback();
  };

  stepButtons.forEach((button) => {
    button.addEventListener("click", () => setStep(Number(button.dataset.goStep)));
  });

  playButton.addEventListener("click", () => setPaused(!isPaused));
  restartButton.addEventListener("click", () => {
    setStep(0);
    setPaused(false);
  });

  setStep(0);
  startPlayback();
}

const motivationSwitcher = document.querySelector(".motivation-switcher");

if (motivationSwitcher) {
  const motivationTabs = [...motivationSwitcher.querySelectorAll("[data-motivation-tab]")];
  let motivationMode = "mask";

  const setMotivation = (mode) => {
    motivationMode = mode;
      motivationSwitcher.dataset.motivation = mode;
      motivationTabs.forEach((item) => {
        const isActive = item.dataset.motivationTab === mode;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });
  };

  motivationTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setMotivation(tab.dataset.motivationTab);
    });
  });

  window.setInterval(() => {
    setMotivation(motivationMode === "mask" ? "noise" : "mask");
  }, 5200);
}

const revealTargets = [...document.querySelectorAll(".content-section")];

if ("IntersectionObserver" in window && revealTargets.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}
