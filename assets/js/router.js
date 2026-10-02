(function () {
  "use strict";

  function resolveBasePath() {
    const isGitHub = window.location.hostname.endsWith("github.io");
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (isGitHub && segments.length > 0) {
      const reserved = ["projects", "tools", "hub", "assets", "pages"];
      if (!reserved.includes(segments[0])) {
        return "/" + segments[0];
      }
    }
    return "";
  }

  const BASE_PATH = resolveBasePath();
  const main = document.getElementById("page-content");

  const routes = {
    "/": "pages/home.html",
    "/projects": "pages/projects.html",
    "/projects/snapdns": "pages/projects/snapdns.html",
    "/tools": "pages/tools.html",
    "/tools/echo": "pages/tools/echo.html",
    "/tools/data": "pages/tools/data.html",
    "/hub": "pages/hub.html",
    "/hub/snake": "pages/hub/snake.html",
    "/hub/rng": "pages/hub/rng.html",
  };

  const titles = {
    "/": "VindE | Home",
    "/projects": "VindE | Projects",
    "/projects/snapdns": "VindE | SnapDNS",
    "/tools": "VindE | Tools",
    "/tools/echo": "VindE | Echo",
    "/tools/data": "VindE | Data Encrypt",
    "/hub": "VindE | Hub",
    "/hub/snake": "VindE | Snake",
    "/hub/rng": "VindE | Randomizer & Wheel",
  };

  const pageScripts = {
    "/": [],
    "/projects": ["assets/js/projects/projects.js"],
    "/projects/snapdns": ["assets/js/projects/snapdns.js"],
    "/tools": [],
    "/tools/echo": [
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
      "assets/js/tools/echo.js",
    ],
    "/tools/data": ["assets/js/tools/data.js"],
    "/hub": [],
    "/hub/snake": ["assets/js/hub/snake.js"],
    "/hub/rng": ["assets/js/hub/rng.js"],
  };

  const pageStyles = {
    "/": [],
    "/projects": ["assets/css/projects/projects.css"],
    "/projects/snapdns": ["assets/css/projects/snapdns.css"],
    "/tools": ["assets/css/tools/tools.css"],
    "/tools/echo": [
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css",
      "assets/css/tools/echo.css",
    ],
    "/tools/data": ["assets/css/tools/data.css"],
    "/hub": ["assets/css/hub/hub.css"],
    "/hub/snake": ["assets/css/hub/snake.css"],
    "/hub/rng": ["assets/css/hub/rng.css"],
  };

  const loadedStyles = new Set();
  const loadedScripts = new Set();

  let currentNavId = 0;
  let activeAbortController = null;

  function loadStyle(href) {
    if (loadedStyles.has(href)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href.startsWith("http") ? href : `${BASE_PATH}/${href}`;

      if (href.includes("cdnjs.cloudflare.com")) {
        link.integrity =
          "sha512-Zcn6bjR/8RZbLEpLIeOwNtzREBAJnUKESxces60Mpoj+2okopSAcSUIUOseddDm0cxnGQzxIR7vJgsLZbdLE3w==";
        link.crossOrigin = "anonymous";
      }

      link.onload = () => {
        loadedStyles.add(href);
        resolve();
      };
      link.onerror = () => reject(new Error(`Failed to load style: ${href}`));
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    if (loadedScripts.has(src)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src.startsWith("http") ? src : `${BASE_PATH}/${src}`;
      script.defer = true;

      if (src.includes("cdnjs.cloudflare.com")) {
        script.integrity =
          "sha512-BwHfrr4c9kmRkLw6iXFdzcdWV/PGkVgiIyIWLLlTSXzWQzxuSg4DiQUCpauz/EWjgk5TYQqX/kvn9pG1NpYfqg==";
        script.crossOrigin = "anonymous";
      }

      script.onload = () => {
        loadedScripts.add(src);
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }

  function updateActiveNav(path) {
    document
      .querySelectorAll(".header-nav a, .tools-btn, .hub-btn")
      .forEach((el) => el.classList.remove("active"));

    document.querySelectorAll(".header-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === path || (href !== "/" && path.startsWith(href))) {
        link.classList.add("active");
      }
    });

    if (path.startsWith("/tools")) {
      const btn = document.querySelector(".tools-btn");
      if (btn) btn.classList.add("active");
    }

    if (path.startsWith("/hub")) {
      const btn = document.querySelector(".hub-btn");
      if (btn) btn.classList.add("active");
    }
  }

  function normalizePath(rawPath) {
    let clean = rawPath.split("#")[0].split("?")[0];
    if (BASE_PATH && clean.startsWith(BASE_PATH)) {
      clean = clean.slice(BASE_PATH.length);
    }
    if (clean.length > 1 && clean.endsWith("/")) {
      clean = clean.slice(0, -1);
    }
    if (clean === "" || clean === "/index.html") {
      clean = "/";
    }
    return clean;
  }

  let isInitialLoad = true;

  async function loadPage(fullPath) {
    const navId = ++currentNavId;

    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();
    const signal = activeAbortController.signal;

    const cleanPath = normalizePath(fullPath);
    document.title = titles[cleanPath] || "VindE | 404";
    updateActiveNav(cleanPath);

    if (cleanPath === "/" && isInitialLoad) {
      isInitialLoad = false;
      if (main) main.classList.add("loaded");
      document.dispatchEvent(new Event("spa-content-loaded"));
      return;
    }

    isInitialLoad = false;
    const targetFile = routes[cleanPath] || "404.html";
    const scripts = pageScripts[cleanPath] || [];
    const styles = pageStyles[cleanPath] || [];

    const header = document.getElementById("header-placeholder");
    const footer = document.getElementById("footer-placeholder");

    try {
      if (main) main.classList.remove("loaded");

      const fetchUrl = `${BASE_PATH}/${targetFile}`;
      const [res] = await Promise.all([
        fetch(fetchUrl, { signal }),
        new Promise((resolve) => setTimeout(resolve, 140)),
      ]);

      if (navId !== currentNavId) return;
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      const rawHtml = await res.text();
      if (navId !== currentNavId) return;

      let content = rawHtml;
      const is404 = !routes[cleanPath];

      if (rawHtml.includes("bsod-container")) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, "text/html");
        content = doc.querySelector(".bsod-container")?.outerHTML || rawHtml;
      }

      window.scrollTo(0, 0);

      if (header) {
        header.classList.toggle("is-hidden", is404);
      }

      if (footer) {
        footer.classList.toggle("is-hidden", is404 || cleanPath === "/");
      }

      if (is404) {
        document.body.classList.remove("light-theme");
      } else {
        const theme = localStorage.getItem("theme") || "dark";
        document.body.classList.toggle("light-theme", theme === "light");
      }

      await Promise.all(styles.map(loadStyle));
      if (navId !== currentNavId) return;

      if (main) {
        main.innerHTML = content;
      }

      for (const src of scripts) {
        await loadScript(src);
        if (navId !== currentNavId) return;
      }

      document.dispatchEvent(new Event("spa-content-loaded"));

      if (main) {
        void main.offsetWidth;
        main.classList.add("loaded");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      if (navId !== currentNavId) return;

      console.error("[Router] Navigation failed:", cleanPath, err);
      if (main) {
        main.innerHTML =
          "<div class='error-pane'><h1>DATA_LOAD_ERROR</h1></div>";
        main.classList.add("loaded");
      }
    }
  }

  window.routerLoadPage = loadPage;
  window.routerBasePath = BASE_PATH;

  document.body.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (
      !href ||
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      link.target === "_blank"
    ) {
      return;
    }

    const cleanPath = normalizePath(href);
    if (routes[cleanPath] || cleanPath === "/") {
      e.preventDefault();
      const targetUrl = `${BASE_PATH}${cleanPath}${link.hash || ""}`;
      history.pushState(null, null, targetUrl);
      loadPage(targetUrl);
    }
  });

  window.addEventListener("popstate", () => {
    loadPage(window.location.pathname + window.location.hash);
  });

  const redirectTarget = sessionStorage.getItem("spa_redirect");
  if (redirectTarget) {
    sessionStorage.removeItem("spa_redirect");
    history.replaceState(null, null, redirectTarget);
    loadPage(redirectTarget);
  } else {
    loadPage(window.location.pathname + window.location.hash);
  }
})();
