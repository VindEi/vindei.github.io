(function () {
  "use strict";

  let isAnimating = false;
  let isExiting = false;

  const initErrorPage = async () => {
    const container = document.querySelector(".bsod-container");
    if (!container || isAnimating) return;
    isAnimating = true;
    isExiting = false;

    const lines = Array.from(document.querySelectorAll(".error-line"));
    let cursor = document.querySelector(".blinking-cursor");
    if (!cursor) {
      cursor = document.createElement("span");
      cursor.className = "blinking-cursor";
      cursor.textContent = "_";
    }

    lines.forEach((line) => {
      line._fullText = line.getAttribute("data-text");
      line.textContent = "";
      line.style.opacity = "1";
    });

    const typeLine = async (element) => {
      const text = element._fullText;
      if (!text) return;

      element.appendChild(cursor);

      for (let i = 0; i < text.length; i++) {
        if (!document.body.contains(element)) return;
        element.insertBefore(document.createTextNode(text[i]), cursor);
        const delay = Math.random() * 25 + 10;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    };

    for (const line of lines) {
      await typeLine(line);
    }

    setTimeout(() => {
      const goHome = () => {
        if (isExiting || window.getSelection().toString().length > 0) return;
        isExiting = true;

        window.removeEventListener("keydown", goHome);
        window.removeEventListener("click", goHome);

        container.style.transition = "filter 0.5s ease, opacity 0.5s ease";
        container.style.filter = "brightness(5) blur(10px)";
        container.style.opacity = "0";

        setTimeout(() => {
          const basePath = window.routerBasePath || "";
          if (window.routerLoadPage) {
            window.history.pushState(null, null, `${basePath}/`);
            window.routerLoadPage(`${basePath}/`);
            setTimeout(() => {
              isAnimating = false;
              isExiting = false;
            }, 500);
          } else {
            window.location.href = `${basePath}/`;
          }
        }, 500);
      };

      window.addEventListener("keydown", goHome);
      window.addEventListener("click", goHome);
    }, 400);
  };

  document.addEventListener("spa-content-loaded", initErrorPage);
  document.addEventListener("DOMContentLoaded", initErrorPage);
})();
