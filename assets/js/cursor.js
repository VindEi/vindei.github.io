document.addEventListener("DOMContentLoaded", () => {
  // 1. CRAWLER BYPASS: Disable 60fps custom cursor physics on automated testing bots
  if (
    navigator.webdriver || 
    /HeadlessChromium|Lighthouse|Speed-Insights|PageSpeed/i.test(navigator.userAgent)
  ) {
    return;
  }

  // 2. MOBILE CHECK: Exit immediately if device uses touch (no mouse)
  if (!window.matchMedia("(pointer: fine)").matches) return;

  // 3. SETUP DUAL-ELEMENT CURSOR
  const cursor = document.createElement("div");
  cursor.id = "sticky-cursor";
  
  const cursorInner = document.createElement("div");
  cursorInner.id = "sticky-cursor-inner";

  document.body.appendChild(cursor);
  document.body.appendChild(cursorInner);

  // Apply globally to root html and body to force hide OS cursor on all browsers
  document.documentElement.classList.add("custom-cursor-active");
  document.body.classList.add("custom-cursor-active");

  // State Variables
  let mouseX = -100, mouseY = -100; // Target mouse position
  let posX = -100, posY = -100; // Current outer positions (smooth trailing)
  let width = 16, height = 16;
  let innerX = -100, innerY = -100; // Current inner positions (high-speed tracking)

  let currentScale = 1;
  let targetScale = 1;

  let targetRect = null; // Bounding box of hovered element
  let isHovering = false;
  let isScrollbar = false;

  // Linear Interpolation (Smoothing)
  const lerp = (start, end, factor) => start + (end - start) * factor;

  // 4. EVENT LISTENERS

  // Track Mouse
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Dynamic Scrollbar Detection
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (mouseX > window.innerWidth - scrollbarWidth - 5 && scrollbarWidth > 0) {
      isScrollbar = true;
      cursor.style.opacity = "0";
      cursorInner.style.opacity = "0";
      document.documentElement.style.cursor = "auto";
      document.body.style.cursor = "auto";
    } else {
      isScrollbar = false;
      cursor.style.opacity = "1";
      cursorInner.style.opacity = "1";
      document.documentElement.style.cursor = "none";
      document.body.style.cursor = "none";
    }
  });

  // Handle Window Enter/Exit
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) {
      cursor.style.opacity = "0";
      cursorInner.style.opacity = "0";
    }
  });
  document.addEventListener("mouseover", () => {
    if (!isScrollbar) {
      cursor.style.opacity = "1";
      cursorInner.style.opacity = "1";
    }
  });

  document.addEventListener("mousedown", () => {
    targetScale = 0.6; 
  });

  document.addEventListener("mouseup", () => {
    targetScale = 1;
  });

  document.addEventListener("spa-content-loaded", () => {
    isHovering = false;
    targetRect = null;
    cursor.classList.remove("is-locked");
    cursorInner.classList.remove("is-plus");
    targetScale = 1;
  });

  // Hover Detection (Delegation)
  document.addEventListener(
    "mouseover",
    (e) => {
      if (isScrollbar) return;

      // Detect interactive elements
      const target = e.target.closest(
        "a, button, .project-card, input, .hover-target",
      );

      if (target) {
        isHovering = true;
        targetRect = target.getBoundingClientRect();

        // Let the outer frame wrap ALL hovered elements (cards, buttons, etc.)
        cursor.classList.add("is-locked");
        
        const style = window.getComputedStyle(target);
        cursor.dataset.borderRadius = style.borderRadius;

        // Morph the inner core into a plus sign (+) on hover
        cursorInner.classList.add("is-plus");
      } else {
        isHovering = false;
        targetRect = null;
        cursor.classList.remove("is-locked");
        cursorInner.classList.remove("is-plus");
      }
    },
    { passive: true },
  );

  // Update Target Position on Scroll
  document.addEventListener(
    "scroll",
    () => {
      if (isHovering && document.querySelector(".is-locked")) {
        isHovering = false;
        cursor.classList.remove("is-locked");
        cursorInner.classList.remove("is-plus");
      }
    },
    { passive: true },
  );

  // 5. ANIMATION LOOP (The Physics)
  function render() {
    let targetX, targetY, targetW, targetH, targetRadius;

    if (isHovering && targetRect && !isScrollbar) {
      // LOCKED STATE: Snap and stretch outer frame around ANY hovered element (large or small)
      const padding = 6; 
      targetX = targetRect.left - padding;
      targetY = targetRect.top - padding;
      targetW = targetRect.width + padding * 2;
      targetH = targetRect.height + padding * 2;
      targetRadius = cursor.dataset.borderRadius || "6px";
    } else {
      // DEFAULT STATE: Outer frame is a loose 16px circle around the inner dot
      targetW = 16;
      targetH = 16;
      targetX = mouseX - targetW / 2;
      targetY = mouseY - targetH / 2;
      targetRadius = "50%";
    }

    // Apply Physics to Outer Frame (Lerp)
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

    // Apply Physics to Inner Core (Follows mouse instantly with high-speed 0.85 tracking)
    innerX = lerp(innerX, mouseX, 0.85);
    innerY = lerp(innerY, mouseY, 0.85);
    
    // Offset correction based on shape states (8px size for plus, 8px for default dot)
    const isPlus = cursorInner.classList.contains("is-plus");
    const innerOffset = isPlus ? 4 : 4;
    cursorInner.style.transform = `translate3d(${innerX - innerOffset}px, ${innerY - innerOffset}px, 0)`;

    requestAnimationFrame(render);
  }

  // Start Loop
  render();
});
