/**
 * Single Page Application Router
 */
(function () {
  "use strict";

  // SPA Route Mappings
  const routes = {
    "/": "/pages/home.html",
    "/projects": "/pages/projects.html",
    "/projects/snapdns": "/pages/projects/snapdns.html",
    "/tools": "/pages/tools.html",
    "/tools/echo": "/pages/tools/echo.html",
    "/tools/data": "/pages/tools/data.html",
    "/hub": "/pages/hub.html",
    "/hub/snake": "/pages/hub/snake.html",
    "/snake": "/pages/hub/snake.html",
    "/hub/rng": "/pages/hub/rng.html",
    "/rng": "/pages/hub/rng.html",
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
    "/snake": "VindE | Snake",
    "/hub/rng": "VindE | RNG",
    "/rng": "VindE | RNG",
  };

  const pageScripts = {
    "/": [],
    "/projects": ["/assets/js/projects/projects.js"],
    "/projects/snapdns": ["/assets/js/projects/snapdns.js"],
    "/tools": [],
    "/tools/echo": [
      {
        src: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
        fallback: "/assets/leaflet/leaflet.js",
      },
      "/assets/js/tools/echo.js",
    ],
    "/tools/data": ["/assets/js/tools/data.js"],
    "/hub": [],
    "/hub/snake": ["/assets/js/hub/snake.js"],
    "/snake": ["/assets/js/hub/snake.js"],
    "/hub/rng": ["/assets/js/hub/rng.js"],
    "/rng": ["/assets/js/hub/rng.js"],
  };

  const pageStyles = {
    "/": [],
    "/projects": ["/assets/css/projects/projects.css"],
    "/projects/snapdns": ["/assets/css/projects/snapdns.css"],
    "/tools": ["/assets/css/tools/tools.css"],
    "/tools/echo": [
      {
        href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css",
        fallback: "/assets/leaflet/leaflet.css",
      },
      "/assets/css/tools/echo.css",
    ],
    "/tools/data": ["/assets/css/tools/data.css"],
    "/hub": ["/assets/css/tools/tools.css"],
    "/hub/snake": ["/assets/css/hub/snake.css"],
    "/snake": ["/assets/css/hub/snake.css"],
    "/hub/rng": ["/assets/css/hub/rng.css"],
    "/rng": ["/assets/css/hub/rng.css"],
  };

  const loadedScripts = new Set();
  const loadedStyles = new Set();

  // Asynchronous stylesheet loader with fallback support
  function loadStyle(item) {
    return new Promise((resolve) => {
      const href = typeof item === "string" ? item : item.href;
      const fallback = typeof item === "object" ? item.fallback : null;
      if (
        loadedStyles.has(href) ||
        document.querySelector(`link[href="${href}"]`)
      ) {
        loadedStyles.add(href);
        return resolve();
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = () => {
        loadedStyles.add(href);
        resolve();
      };
      link.onerror = () => {
        if (fallback && !loadedStyles.has(fallback)) {
          console.warn("[Router] Style failed, loading fallback:", fallback);
          const fallbackLink = document.createElement("link");
          fallbackLink.rel = "stylesheet";
          fallbackLink.href = fallback;
          fallbackLink.onload = () => {
            loadedStyles.add(fallback);
            loadedStyles.add(href);
            resolve();
          };
          fallbackLink.onerror = () => {
            console.warn("[Router] Fallback style also failed:", fallback);
            resolve();
          };
          document.head.appendChild(fallbackLink);
        } else {
          console.warn("[Router] Failed to load style:", href);
          resolve();
        }
      };
      loadedStyles.add(href);
      document.head.appendChild(link);
    });
  }

  // Safe script loader with fallback support
  function loadScript(item) {
    return new Promise((resolve) => {
      const src = typeof item === "string" ? item : item.src;
      const fallback = typeof item === "object" ? item.fallback : null;
      if (
        loadedScripts.has(src) ||
        document.querySelector(`script[src="${src}"]`)
      ) {
        loadedScripts.add(src);
        return resolve();
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        loadedScripts.add(src);
        resolve();
      };
      script.onerror = () => {
        if (fallback && !loadedScripts.has(fallback)) {
          console.warn("[Router] Script failed, loading fallback:", fallback);
          const fallbackScript = document.createElement("script");
          fallbackScript.src = fallback;
          fallbackScript.onload = () => {
            loadedScripts.add(fallback);
            loadedScripts.add(src);
            resolve();
          };
          fallbackScript.onerror = () => {
            console.warn("[Router] Fallback script also failed:", fallback);
            resolve();
          };
          document.body.appendChild(fallbackScript);
        } else {
          console.warn("[Router] Failed to load script:", src);
          resolve();
        }
      };
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

    if (
      (path === "/tools" || path.startsWith("/tools/")) &&
      document.querySelector(".tools-btn")
    ) {
      document.querySelector(".tools-btn").classList.add("active");
    }
    if (
      (path === "/hub" || path.startsWith("/hub/") || path === "/rng" || path === "/snake") &&
      document.querySelector(".hub-btn")
    ) {
      document.querySelector(".hub-btn").classList.add("active");
    }
  }

  let isInitialRender = true;

  async function loadPage(path) {
    const main = document.getElementById("page-content");
    if (!main) return;

    const rawPath = path.split("#")[0].split("?")[0];
    let cleanPath = rawPath.replace(/\/+$/, "") || "/";
    if (cleanPath === "/index.html") cleanPath = "/";

    document.title = titles[cleanPath] || "VindE | 404";
    updateActiveNav(cleanPath);

    // Initial load optimization for home page shell
    if (cleanPath === "/" && isInitialRender) {
      isInitialRender = false;
      main.classList.add("loaded");
      document.dispatchEvent(new Event("spa-content-loaded"));
      return;
    }

    if (isInitialRender && cleanPath !== "/") {
      main.classList.remove("loaded");
    }

    isInitialRender = false;

    const routeFile = routes[cleanPath] || "/404.html";
    const scriptsToLoad = [...(pageScripts[cleanPath] || [])];
    const stylesToLoad = [...(pageStyles[cleanPath] || [])];

    const header = document.getElementById("header-placeholder");
    const footer = document.getElementById("footer-placeholder");

    try {
      const res = await fetch(routeFile);
      if (!res.ok) throw new Error("HTTP_ERR");
      const rawHtml = await res.text();

      let content = rawHtml;
      let is404 = false;

      if (rawHtml.includes("bsod-container")) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, "text/html");
        content = doc.querySelector(".bsod-container")?.outerHTML || rawHtml;
        is404 = true;
        scriptsToLoad.push("/assets/js/error.js");
        stylesToLoad.push("/assets/css/error.css");
      }

      main.classList.remove("loaded");

      // Reset scroll position
      window.scrollTo(0, 0);

      // Visibility toggles
      if (is404 || cleanPath === "/") {
        if (header) header.classList.toggle("is-hidden", is404);
        if (footer) footer.classList.add("is-hidden");
      } else {
        if (header) header.classList.remove("is-hidden");
        if (footer) footer.classList.remove("is-hidden");
      }

      // Theme persistence
      if (is404) {
        document.body.classList.remove("light-theme");
      } else {
        const savedTheme = localStorage.getItem("theme") || "dark";
        if (savedTheme === "light") {
          document.body.classList.add("light-theme");
        } else {
          document.body.classList.remove("light-theme");
        }
      }

      // Load stylesheets first so elements never render unstyled (prevents button/border transition flash)
      await Promise.all(stylesToLoad.map(loadStyle));

      // Inject HTML content
      main.innerHTML = content;
      window.scrollTo(0, 0);

      // Load required scripts
      for (const src of scriptsToLoad) {
        await loadScript(src);
      }

      void main.offsetWidth;
      main.classList.add("loaded");
      document.dispatchEvent(new Event("spa-content-loaded"));
    } catch (err) {
      console.error("[Router] Failed to load path:", cleanPath, err);
      main.innerHTML = "<h1>DATA_LOAD_ERROR</h1>";
      main.classList.add("loaded");
    }
  }

  window.routerLoadPage = loadPage;

  // Intercept local SPA link clicks
  document.body.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (
      link &&
      link.getAttribute("href")?.startsWith("/") &&
      !link.getAttribute("target")
    ) {
      const url = link.getAttribute("href");
      const path = url.split("#")[0].split("?")[0];
      let cleanPath = path.replace(/\/+$/, "") || "/";
      if (cleanPath === "/index.html") cleanPath = "/";

      const isSamePath =
        cleanPath === window.location.pathname ||
        (cleanPath === "/" && window.location.pathname === "/index.html");
      const isHashClearing =
        window.location.hash.length > 0 && !url.includes("#");

      if (isSamePath && !isHashClearing) {
        e.preventDefault();
        return;
      }

      if (routes[cleanPath]) {
        e.preventDefault();
        history.pushState(null, null, url);
        loadPage(url);
      }
    }
  });

  window.addEventListener("popstate", () => loadPage(location.pathname));

  function startRouter() {
    const redirect = sessionStorage.getItem("spa_redirect");
    if (redirect) {
      sessionStorage.removeItem("spa_redirect");
      history.replaceState(null, null, redirect);
      loadPage(redirect);
      return;
    }
    loadPage(location.pathname);
  }

  // Reliable initial load execution check
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startRouter);
  } else {
    startRouter();
  }
})();
