(function () {
  "use strict";

  const CACHE_KEY = "vinde_snapdns_tag";
  const CACHE_TIME = "vinde_snapdns_tag_time";

  function setupImageFallbacks() {
    const cdnBase = "https://cdn.jsdelivr.net/gh/VindEi/SnapDNS@main/assets";
    document
      .querySelectorAll(".product-logo, .app-screenshot")
      .forEach((img) => {
        img.addEventListener(
          "error",
          function () {
            if (!this.dataset.fallbackTried) {
              this.dataset.fallbackTried = "true";
              const fileName = this.src.split("/").pop();
              this.src = `${cdnBase}/${fileName}`;
            }
          },
          { once: true },
        );
      });
  }

  async function syncLatestSnapDNSVersion() {
    const modal = document.getElementById("download-modal");
    if (!modal) return;

    const now = Date.now();
    const cachedTime = localStorage.getItem(CACHE_TIME);
    let latestTag = null;

    if (cachedTime && now - parseInt(cachedTime, 10) < 60 * 60 * 1000) {
      latestTag = localStorage.getItem(CACHE_KEY);
    } else {
      try {
        const response = await fetch(
          "https://api.github.com/repos/VindEi/SnapDNS/releases/latest",
        );
        if (response.ok) {
          const data = await response.json();
          latestTag = data.tag_name;
          if (latestTag) {
            localStorage.setItem(CACHE_KEY, latestTag);
            localStorage.setItem(CACHE_TIME, now.toString());
          }
        }
      } catch (e) {}
    }

    if (!latestTag) return;

    const modalLinks = modal.querySelectorAll(".modal-item");
    modalLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.includes("/releases/download/")) {
        const newHref = href.replace(
          /\/releases\/download\/[^/]+\//,
          `/releases/download/${latestTag}/`,
        );
        link.setAttribute("href", newHref);
      }
    });

    const modalHeader = modal.querySelector(".modal-header h2");
    if (modalHeader && !modalHeader.querySelector(".ver-badge")) {
      const badge = document.createElement("span");
      badge.className = "tag-pill type ver-badge";
      badge.innerText = latestTag;
      modalHeader.appendChild(badge);
    }
  }

  function initSnapDNS() {
    setupImageFallbacks();

    const visual = document.querySelector(".product-visual");
    if (!visual) return;

    const toggleSwap = () => {
      if (window.innerWidth < 900) {
        visual.classList.toggle("swapped");
      }
    };

    visual.addEventListener("click", toggleSwap);
    visual.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSwap();
      }
    });

    const dbtn = document.getElementById("dynamic-download-btn");
    const modal = document.getElementById("download-modal");
    const closeModal = document.getElementById("close-modal-btn");

    if (dbtn && modal) {
      const ua = navigator.userAgent.toLowerCase();
      document
        .querySelectorAll(".modal-group")
        .forEach((el) => el.classList.remove("recommended"));

      if (ua.includes("win")) {
        const winGroup = document.getElementById("group-win");
        if (winGroup) winGroup.classList.add("recommended");
      } else if (ua.includes("android")) {
        const androidGroup = document.getElementById("group-android");
        if (androidGroup) androidGroup.classList.add("recommended");
      }

      const closeModalWindow = () => {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        document.removeEventListener("keydown", handleEscapeKey);
      };

      const handleEscapeKey = (e) => {
        if (e.key === "Escape") closeModalWindow();
      };

      dbtn.addEventListener("click", (e) => {
        e.preventDefault();
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        document.addEventListener("keydown", handleEscapeKey);
      });

      if (closeModal) {
        closeModal.addEventListener("click", closeModalWindow);
      }

      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModalWindow();
      });

      syncLatestSnapDNSVersion();
    }
  }

  document.addEventListener("spa-content-loaded", initSnapDNS);
})();
