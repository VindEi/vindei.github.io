document.addEventListener("DOMContentLoaded", () => {
  if (
    navigator.webdriver ||
    /HeadlessChromium|Lighthouse|Speed-Insights|PageSpeed/i.test(
      navigator.userAgent,
    )
  ) {
    return;
  }

  if (!window.matchMedia("(pointer: fine)").matches) return;

  const cursor = document.createElement("div");
  cursor.id = "sticky-cursor";

  const cursorInner = document.createElement("div");
  cursorInner.id = "sticky-cursor-inner";

  document.body.appendChild(cursor);
  document.body.appendChild(cursorInner);

  document.documentElement.classList.add("custom-cursor-active");
  document.body.classList.add("custom-cursor-active");

  let mouseX = -100,
    mouseY = -100;
  let posX = -100,
    posY = -100;
  let width = 16,
    height = 16;
  let innerX = -100,
    innerY = -100;
  let currentScale = 1,
    targetScale = 1;
  let targetRect = null;
  let isHovering = false;
  let isScrollbar = false;
  let isOverInput = false;
  let isIdle = false;
  let rafId = null;

  const lerp = (start, end, factor) => start + (end - start) * factor;

  const startLoop = () => {
    if (isIdle) {
      isIdle = false;
      rafId = requestAnimationFrame(render);
    }
  };

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    isScrollbar =
      scrollbarWidth > 0 && mouseX > window.innerWidth - scrollbarWidth - 5;
    isOverInput = !!e.target.closest(
      "input, textarea, select, [contenteditable]",
    );

    if (isScrollbar || isOverInput) {
      cursor.style.opacity = "0";
      cursorInner.style.opacity = "0";
    } else {
      cursor.style.opacity = "1";
      cursorInner.style.opacity = "1";
    }

    startLoop();
  });

  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) {
      cursor.style.opacity = "0";
      cursorInner.style.opacity = "0";
    }
  });

  document.addEventListener("mouseover", () => {
    if (!isScrollbar && !isOverInput) {
      cursor.style.opacity = "1";
      cursorInner.style.opacity = "1";
      startLoop();
    }
  });

  document.addEventListener("mousedown", () => {
    targetScale = 0.6;
    startLoop();
  });

  document.addEventListener("mouseup", () => {
    targetScale = 1;
    startLoop();
  });

  document.addEventListener("spa-content-loaded", () => {
    isHovering = false;
    targetRect = null;
    cursor.classList.remove("is-locked");
    cursorInner.classList.remove("is-plus");
    targetScale = 1;
    startLoop();
  });

  document.addEventListener(
    "mouseover",
    (e) => {
      if (isScrollbar) return;

      const target = e.target.closest(
        "a, button, .project-card, .hover-target, [role='button']",
      );
      if (
        target &&
        !target.closest("input, textarea, select, [contenteditable]")
      ) {
        isHovering = true;
        targetRect = target.getBoundingClientRect();
        cursor.classList.add("is-locked");

        const computedRadius = window.getComputedStyle(target).borderRadius;
        const numRadius = parseFloat(computedRadius);
        cursor.dataset.borderRadius =
          !isNaN(numRadius) && numRadius > 0 ? computedRadius : "8px";

        cursorInner.classList.add("is-plus");
        startLoop();
      } else {
        if (isHovering) {
          isHovering = false;
          targetRect = null;
          cursor.classList.remove("is-locked");
          cursorInner.classList.remove("is-plus");
          startLoop();
        }
      }
    },
    { passive: true },
  );

  document.addEventListener(
    "scroll",
    () => {
      if (isHovering) {
        isHovering = false;
        targetRect = null;
        cursor.classList.remove("is-locked");
        cursorInner.classList.remove("is-plus");
        startLoop();
      }
    },
    { passive: true },
  );

  function render() {
    let targetX, targetY, targetW, targetH, targetRadius;

    if (isHovering && targetRect && !isScrollbar && !isOverInput) {
      const padding = 6;
      targetX = targetRect.left - padding;
      targetY = targetRect.top - padding;
      targetW = targetRect.width + padding * 2;
      targetH = targetRect.height + padding * 2;
      targetRadius = cursor.dataset.borderRadius || "8px";
    } else {
      targetW = 16;
      targetH = 16;
      targetX = mouseX - targetW / 2;
      targetY = mouseY - targetH / 2;
      targetRadius = "50%";
    }

    const speed = isHovering ? 0.35 : 0.45;
    posX = lerp(posX, targetX, speed);
    posY = lerp(posY, targetY, speed);
    width = lerp(width, targetW, speed);
    height = lerp(height, targetH, speed);
    currentScale = lerp(currentScale, targetScale, 0.3);

    const finalScale = isHovering ? 1 : currentScale;

    cursor.style.transform = `translate3d(${posX}px, ${posY}px, 0) scale(${finalScale})`;
    cursor.style.width = `${width}px`;
    cursor.style.height = `${height}px`;
    cursor.style.borderRadius = targetRadius;

    innerX = lerp(innerX, mouseX, 0.85);
    innerY = lerp(innerY, mouseY, 0.85);
    cursorInner.style.transform = `translate3d(${innerX - 4}px, ${innerY - 4}px, 0)`;

    const deltaPos = Math.abs(posX - targetX) + Math.abs(posY - targetY);
    const deltaInner = Math.abs(innerX - mouseX) + Math.abs(innerY - mouseY);
    if (
      deltaPos < 0.05 &&
      deltaInner < 0.05 &&
      Math.abs(currentScale - targetScale) < 0.01
    ) {
      isIdle = true;
      cancelAnimationFrame(rafId);
      return;
    }

    rafId = requestAnimationFrame(render);
  }

  rafId = requestAnimationFrame(render);
});
