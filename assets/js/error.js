/**
 * VindE - Fatal Error (BSOD) Interface controller
 * 
 * Features:
 * 1. Safe, non-destructive dynamic cursor typing engine.
 * 2. Scoped transition physics strictly bound to container to prevent global body leaks.
 * 3. Anti-spam single-execution locks.
 */
(function () {
  "use strict";

  let isAnimating = false;
  let isExiting = false;

  const initErrorPage = async () => {
    const container = document.querySelector(".bsod-container");
    if (!container) return; // Not on error page
    if (isAnimating) return; // Prevent double firing
    isAnimating = true;
    isExiting = false; // Reset lock on init

    // Elements
    const lines = Array.from(document.querySelectorAll(".error-line"));

    // SAFELY GENERATE CURSOR:
    // Dynamically instantiate the blinking cursor node in JS memory.
    // This makes it completely immune to DOM textContent clearance bugs.
    let cursor = document.querySelector(".blinking-cursor");
    if (!cursor) {
      cursor = document.createElement("span");
      cursor.className = "blinking-cursor";
      cursor.textContent = "_";
    }

    // Reset state (clear text safely)
    lines.forEach((line) => {
      line._fullText = line.getAttribute("data-text");
      line.textContent = "";
      line.style.opacity = "1";
    });

    // --- TYPING LOGIC ---
    const typeLine = async (element) => {
      const text = element._fullText;
      if (!text) return;

      // Move the cursor directly into the active typing row
      element.appendChild(cursor);

      for (let i = 0; i < text.length; i++) {
        // Halt if the user navigated away during typing
        if (!document.body.contains(element)) return;

        // Insert characters right before the cursor node
        element.insertBefore(document.createTextNode(text[i]), cursor);

        // Random typing variance for realism
        const delay = Math.random() * 30 + 10;
        await new Promise((r) => setTimeout(r, delay));
      }
    };

    // Process lines sequentially
    for (const line of lines) {
      await typeLine(line);
    }

    // Enable Exit Interaction
    setTimeout(() => {
      const goHome = (e) => {
        // Lock execution to prevent double-clicks or key spam from breaking SPA routes
        if (isExiting) return;
        if (window.getSelection().toString().length > 0) return;
        isExiting = true;

        window.removeEventListener("keydown", goHome);
        window.removeEventListener("click", goHome);

        // SECURE COSMETICS OVERRIDE:
        // Transition and brightness-blur are applied strictly to the .bsod-container
        // leaving your document.body and custom cursor completely untouched and unpolluted.
        container.style.transition = "filter 0.5s ease, opacity 0.5s ease";
        container.style.filter = "brightness(5) blur(10px)";
        container.style.opacity = "0";

        // Navigation Delay
        setTimeout(() => {
          if (window.routerLoadPage) {
            // SPA Transition (container is destroyed naturally by router)
            window.history.pushState(null, null, "/");
            window.routerLoadPage("/");
            
            setTimeout(() => {
              isAnimating = false;
              isExiting = false;
            }, 500);
          } else {
            // Hard Reload Fallback
            window.location.href = "/";
          }
        }, 500);
      };

      window.addEventListener("keydown", goHome);
      window.addEventListener("click", goHome);
    }, 500);
  };

  // Attach Listeners
  document.addEventListener("spa-content-loaded", initErrorPage);
  document.addEventListener("DOMContentLoaded", initErrorPage);
})();