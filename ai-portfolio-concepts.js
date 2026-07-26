(function () {
  "use strict";

  const practice = document.querySelector("[data-ai-practice]");
  if (!practice) return;

  const journey = practice.querySelector("[data-ai-journey]");
  const sticky = practice.querySelector(".ai-practice__sticky");
  const ring = practice.querySelector("[data-ai-orbit-ring]");
  const items = Array.from(practice.querySelectorAll("[data-ai-orbit-item]"));
  const projects = Array.from(practice.querySelectorAll("[data-ai-practice-project]"));
  const languageToggle = practice.querySelector("[data-ai-language-toggle]");
  const desktopQuery = window.matchMedia("(min-width: 901px)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const orbitLabelCount = 33;
  const orbitLabelStep = 11;
  const selectedLabelStride = 6;
  const scrollSnapDelay = 280;

  if (!journey || !sticky || !ring || !items.length || items.length !== projects.length) return;

  function selectedAngleStep() {
    return orbitLabelStep * selectedLabelStride;
  }

  function buildDenseOrbit() {
    const labels = items.map(function (item) {
      const label = item.querySelector("[data-ai-orbit-label]");
      return {
        en: label ? label.dataset.aiEn : "",
        zh: label ? label.dataset.aiZh : ""
      };
    });
    const selectedPositions = new Set();

    items.forEach(function (item, index) {
      const position = index * selectedLabelStride;
      selectedPositions.add(position);
      item.dataset.aiOrbitTarget = String(index);
      item.dataset.aiOrbitPosition = String(position);
      item.style.setProperty("--orbit-angle", (position * orbitLabelStep) + "deg");
      item.style.setProperty("--orbit-position", String(position));
    });

    Array.from(ring.querySelectorAll(".ai-orbit__echo")).forEach(function (echo) {
      echo.remove();
    });

    for (let position = 0; position < orbitLabelCount; position += 1) {
      if (selectedPositions.has(position)) continue;

      // Repeat complete six-project sets, rotating each set by one item.
      // This preserves the circular rhythm without placing duplicate titles
      // next to one another at the joins between sets.
      const groupIndex = Math.floor(position / selectedLabelStride);
      const positionInGroup = position % selectedLabelStride;
      const targetIndex = (groupIndex + positionInGroup) % labels.length;
      const source = labels[targetIndex];
      const echo = document.createElement("button");
      const text = document.createElement("strong");

      echo.className = "ai-orbit__echo";
      echo.type = "button";
      echo.tabIndex = -1;
      echo.dataset.aiOrbitEcho = "";
      echo.dataset.aiOrbitTarget = String(targetIndex);
      echo.dataset.aiOrbitPosition = String(position);
      echo.style.setProperty("--orbit-angle", (position * orbitLabelStep) + "deg");
      echo.style.setProperty("--orbit-position", String(position));

      text.dataset.aiEn = source.en;
      text.dataset.aiZh = source.zh;
      text.textContent = source.en;
      echo.appendChild(text);
      ring.appendChild(echo);
    }

    ring.style.setProperty("--orbit-label-count", String(orbitLabelCount));
  }

  buildDenseOrbit();

  const state = {
    active: 0,
    language: "en",
    currentRotation: 0,
    targetRotation: 0,
    animationFrame: 0,
    scrollFrame: 0,
    scrollStopTimer: 0,
    scrollAnimationFrame: 0,
    programmaticScroll: false
  };

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
  }

  function languageValue(element) {
    if (!element) return "";
    return state.language === "zh" ? element.dataset.aiZh : element.dataset.aiEn;
  }

  function drawOrbit() {
    ring.style.transform = "rotate(" + state.currentRotation + "deg)";
  }

  function stopOrbitAnimation() {
    if (!state.animationFrame) return;
    window.cancelAnimationFrame(state.animationFrame);
    state.animationFrame = 0;
  }

  function selectProject(index, options) {
    const settings = options || {};
    const nextIndex = clamp(index, 0, items.length - 1);
    state.active = nextIndex;

    items.forEach(function (item, itemIndex) {
      const active = itemIndex === nextIndex;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
      item.tabIndex = active ? 0 : -1;
    });

    projects.forEach(function (project, projectIndex) {
      const active = projectIndex === nextIndex;
      project.classList.toggle("is-active", active);
      project.setAttribute("aria-hidden", String(!active));
      project.inert = !active;
    });

    if (settings.focus) items[nextIndex].focus({ preventScroll: true });
    if (settings.revealMobile) scrollMobileItemIntoView(items[nextIndex]);
  }

  function projectFromRotation() {
    return clamp(Math.round(-state.currentRotation / selectedAngleStep()), 0, items.length - 1);
  }

  function ensureOrbitAnimation() {
    if (state.animationFrame) return;

    if (!desktopQuery.matches || reducedMotionQuery.matches) {
      state.currentRotation = state.targetRotation;
      drawOrbit();
      selectProject(projectFromRotation());
      return;
    }

    function step() {
      const distance = state.targetRotation - state.currentRotation;

      if (Math.abs(distance) < 0.02) {
        state.currentRotation = state.targetRotation;
        drawOrbit();
        selectProject(projectFromRotation());
        state.animationFrame = 0;
        return;
      }

      state.currentRotation += distance * 0.2;
      drawOrbit();

      const nextProject = projectFromRotation();
      if (nextProject !== state.active) selectProject(nextProject);

      state.animationFrame = window.requestAnimationFrame(step);
    }

    state.animationFrame = window.requestAnimationFrame(step);
  }

  function scrollMobileItemIntoView(item) {
    if (desktopQuery.matches || !item) return;
    const left = item.offsetLeft - ((ring.clientWidth - item.offsetWidth) / 2);
    ring.scrollTo({
      left: Math.max(0, left),
      behavior: reducedMotionQuery.matches ? "auto" : "smooth"
    });
  }

  function journeyMetrics() {
    const top = journey.getBoundingClientRect().top + window.scrollY;
    const range = Math.max(1, journey.offsetHeight - sticky.offsetHeight);
    return { top: top, range: range };
  }

  function heldScrollPosition(progress) {
    const rawPosition = clamp(progress, 0, 1) * (items.length - 1);
    const base = Math.min(items.length - 1, Math.floor(rawPosition));
    const local = rawPosition - base;
    const hold = 0.26;

    if (base >= items.length - 1 || local <= hold) return base;
    if (local >= 1 - hold) return base + 1;

    const moving = (local - hold) / (1 - (hold * 2));
    const eased = moving * moving * (3 - (2 * moving));
    return base + eased;
  }

  function updateFromScroll() {
    state.scrollFrame = 0;
    if (!desktopQuery.matches) return;

    const metrics = journeyMetrics();
    const progress = clamp((window.scrollY - metrics.top) / metrics.range, 0, 1);
    const ringPosition = heldScrollPosition(progress);
    state.targetRotation = ringPosition * -selectedAngleStep();
    ensureOrbitAnimation();
  }

  function stopScrollAnimation() {
    if (state.scrollAnimationFrame) {
      window.cancelAnimationFrame(state.scrollAnimationFrame);
      state.scrollAnimationFrame = 0;
    }
    state.programmaticScroll = false;
    document.documentElement.classList.remove("is-ai-orbit-jumping");
  }

  function animateWindowScroll(destination, duration) {
    stopScrollAnimation();

    const start = window.scrollY;
    const distance = destination - start;
    const timing = reducedMotionQuery.matches ? 0 : duration;

    if (!timing || Math.abs(distance) < 2) {
      window.scrollTo({ top: destination, behavior: "auto" });
      updateFromScroll();
      return;
    }

    const startedAt = window.performance.now();
    state.programmaticScroll = true;
    document.documentElement.classList.add("is-ai-orbit-jumping");

    function step(now) {
      const progress = clamp((now - startedAt) / timing, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, start + (distance * eased));

      if (progress < 1) {
        state.scrollAnimationFrame = window.requestAnimationFrame(step);
        return;
      }

      state.scrollAnimationFrame = 0;
      state.programmaticScroll = false;
      document.documentElement.classList.remove("is-ai-orbit-jumping");
      updateFromScroll();
    }

    state.scrollAnimationFrame = window.requestAnimationFrame(step);
  }

  function snapToNearestProject() {
    state.scrollStopTimer = 0;
    if (!desktopQuery.matches || state.programmaticScroll) return;

    const metrics = journeyMetrics();
    const relative = window.scrollY - metrics.top;
    if (relative <= 24 || relative >= metrics.range - 24) return;

    const nearestIndex = Math.round((relative / metrics.range) * (items.length - 1));
    const destination = metrics.top + ((nearestIndex / (items.length - 1)) * metrics.range);
    if (Math.abs(window.scrollY - destination) < 4) return;
    animateWindowScroll(destination, 240);
  }

  function requestScrollUpdate(event) {
    if (!desktopQuery.matches) return;

    if (event && event.type === "scroll" && !state.programmaticScroll) {
      window.clearTimeout(state.scrollStopTimer);
      state.scrollStopTimer = window.setTimeout(snapToNearestProject, scrollSnapDelay);
    }

    if (state.scrollFrame) return;
    state.scrollFrame = window.requestAnimationFrame(updateFromScroll);
  }

  function handleUserScrollIntent() {
    if (!desktopQuery.matches) return;

    // A fresh wheel gesture must take control immediately. Otherwise an
    // in-flight snap animation can pull the page back toward the old project.
    if (state.programmaticScroll) stopScrollAnimation();
    window.clearTimeout(state.scrollStopTimer);
  }

  function scrollToProject(index) {
    if (!desktopQuery.matches) {
      selectProject(index, { revealMobile: true });
      return;
    }

    const metrics = journeyMetrics();
    const destination = metrics.top + ((index / (items.length - 1)) * metrics.range);
    animateWindowScroll(destination, 360);
  }

  function setLanguage(language) {
    state.language = language === "zh" ? "zh" : "en";
    practice.dataset.aiLanguage = state.language;
    practice.setAttribute("lang", state.language === "zh" ? "zh-CN" : "en");

    Array.from(practice.querySelectorAll("[data-ai-en][data-ai-zh]")).forEach(function (element) {
      element.textContent = languageValue(element);
    });

    Array.from(practice.querySelectorAll("[data-ai-aria-en][data-ai-aria-zh]")).forEach(function (element) {
      element.setAttribute("aria-label", state.language === "zh" ? element.dataset.aiAriaZh : element.dataset.aiAriaEn);
    });

    Array.from(practice.querySelectorAll("[data-ai-alt-en][data-ai-alt-zh]")).forEach(function (image) {
      image.alt = state.language === "zh" ? image.dataset.aiAltZh : image.dataset.aiAltEn;
    });

    if (languageToggle) {
      const labels = languageToggle.querySelectorAll("span");
      if (labels.length >= 2) {
        labels[0].classList.toggle("is-active", state.language === "en");
        labels[1].classList.toggle("is-active", state.language === "zh");
      }
      languageToggle.setAttribute("aria-pressed", String(state.language === "zh"));
      languageToggle.setAttribute(
        "aria-label",
        state.language === "en" ? "Switch AI Practice language to Chinese" : "将 AI 实践切换为英文"
      );
    }

    try {
      window.localStorage.setItem("cici-ai-practice-language", state.language);
    } catch (error) {
      // Language switching remains available when storage is blocked.
    }
  }

  items.forEach(function (item, index) {
    item.addEventListener("click", function () {
      scrollToProject(index);
    });

    item.addEventListener("keydown", function (event) {
      let nextIndex = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = Math.min(items.length - 1, index + 1);
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = Math.max(0, index - 1);
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = items.length - 1;
      else return;

      event.preventDefault();
      scrollToProject(nextIndex);
      if (desktopQuery.matches) items[nextIndex].focus({ preventScroll: true });
      else selectProject(nextIndex, { focus: true, revealMobile: true });
    });
  });

  ring.addEventListener("click", function (event) {
    const echo = event.target.closest("[data-ai-orbit-echo]");
    if (!echo || !ring.contains(echo)) return;
    scrollToProject(Number(echo.dataset.aiOrbitTarget));
  });

  if (languageToggle) {
    languageToggle.addEventListener("click", function () {
      setLanguage(state.language === "en" ? "zh" : "en");
    });
  }

  function handleLayoutChange(event) {
    const activeBeforeLayout = state.active;
    const crossedDesktopBreakpoint = Boolean(event && event.media === desktopQuery.media);

    stopOrbitAnimation();
    stopScrollAnimation();
    window.clearTimeout(state.scrollStopTimer);

    if (desktopQuery.matches) {
      if (crossedDesktopBreakpoint) {
        const metrics = journeyMetrics();
        const destination = metrics.top + ((activeBeforeLayout / (items.length - 1)) * metrics.range);
        window.scrollTo({ top: destination, behavior: "auto" });
      }
      updateFromScroll();
      return;
    }

    ring.style.transform = "none";
    selectProject(activeBeforeLayout, { revealMobile: true });

    if (crossedDesktopBreakpoint) {
      const practiceTop = practice.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: practiceTop, behavior: "auto" });
    }
  }

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("wheel", handleUserScrollIntent, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  desktopQuery.addEventListener("change", handleLayoutChange);
  reducedMotionQuery.addEventListener("change", handleLayoutChange);

  let initialLanguage = "en";
  try {
    const storedLanguage = window.localStorage.getItem("cici-ai-practice-language");
    if (storedLanguage === "zh" || storedLanguage === "en") initialLanguage = storedLanguage;
  } catch (error) {
    initialLanguage = "en";
  }

  setLanguage(initialLanguage);
  selectProject(0);
  handleLayoutChange();
})();
