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
  const diagram = pipelineDemo.querySelector(".pipeline-diagram");
  const playButton = pipelineDemo.querySelector(".diagram-play");
  const restartButton = pipelineDemo.querySelector(".diagram-restart");
  const stepButtons = [...pipelineDemo.querySelectorAll("[data-go-step]")];
  const stepCount = pipelineDemo.querySelector(".step-count");
  const stepTitle = pipelineDemo.querySelector(".step-title");
  const stepDescription = pipelineDemo.querySelector(".step-description");
  const steps = [
    {
      title: "Sample on-policy trajectories",
      description:
        "The student sees the full image and generates answer prefixes. Both teacher branches reuse those exact prefixes.",
    },
    {
      title: "Contrast positive and negative evidence",
      description:
        "CDL pulls the student toward the answer-related crop and away from an unrelated crop; DAG gates unreliable samples and uninformative tokens.",
    },
    {
      title: "Update the grounded policy",
      description:
        "The combined JSD and gated contrastive objective updates the student, while the EMA teacher tracks the new policy for the next iteration.",
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

    if (diagram && typeof diagram.pauseAnimations === "function") {
      if (paused) diagram.pauseAnimations();
      else diagram.unpauseAnimations();
    }

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
    if (diagram && typeof diagram.setCurrentTime === "function") diagram.setCurrentTime(0);
  });

  setStep(0);
  startPlayback();
}
