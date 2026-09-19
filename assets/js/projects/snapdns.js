/**
 * VindE - SnapDNS Product Page Logic
 */

async function syncLatestSnapDNSVersion() {
  const modal = document.getElementById("download-modal");
  if (!modal) return;

  const CACHE_KEY = "vinde_snapdns_tag";
  const CACHE_TIME = "vinde_snapdns_tag_time";
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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      latestTag = data.tag_name;

      if (latestTag) {
        localStorage.setItem(CACHE_KEY, latestTag);
        localStorage.setItem(CACHE_TIME, now.toString());
      }
    } catch (error) {
      console.warn(
        "[SnapDNS] Dynamic release check failed, using fallback:",
        error,
      );
    }
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
    badge.style.marginLeft = "12px";
    badge.style.fontSize = "0.75rem";
    badge.innerText = latestTag;
    modalHeader.appendChild(badge);
  }
}

function initSnapDNS() {
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
    if (modal.parentNode !== document.body) {
      document.body.appendChild(modal);
    }

    const cleanUpModal = () => {
      if (modal && modal.parentNode === document.body) {
        modal.parentNode.removeChild(modal);
      }
      document.removeEventListener("spa-content-loaded", cleanUpModal);
    };
    document.addEventListener("spa-content-loaded", cleanUpModal, {
      once: true,
    });

    const ua = navigator.userAgent.toLowerCase();
    const isWin = ua.includes("win");
    const isAndroid = ua.includes("android");

    document
      .querySelectorAll(".modal-group")
      .forEach((el) => el.classList.remove("recommended"));

    if (isWin) {
      const winGroup = document.getElementById("group-win");
      if (winGroup) winGroup.classList.add("recommended");
    } else if (isAndroid) {
      const androidGroup = document.getElementById("group-android");
      if (androidGroup) androidGroup.classList.add("recommended");
    }

    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        modal.classList.remove("open");
        document.removeEventListener("keydown", handleEscapeKey);
      }
    };

    dbtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.add("open");
      document.addEventListener("keydown", handleEscapeKey);
    });

    if (closeModal) {
      closeModal.addEventListener("click", () => {
        modal.classList.remove("open");
        document.removeEventListener("keydown", handleEscapeKey);
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");
        document.removeEventListener("keydown", handleEscapeKey);
      }
    });

    syncLatestSnapDNSVersion();
  }
}

document.addEventListener("spa-content-loaded", initSnapDNS);
document.addEventListener("DOMContentLoaded", initSnapDNS);
