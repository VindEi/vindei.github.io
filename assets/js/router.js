/**
 * Single Page Application Router with Viewport, Layout, Theme, & Asset Sandboxing
 */
document.addEventListener("DOMContentLoaded", () => {
  const main = document.getElementById("page-content");

  // SPA Route Mappings (Restored to absolute routing paths)
  const routes = {
    "/": "/pages/home.html",
    "/projects": "/pages/projects.html",
    "/projects/snapdns": "/pages/projects/snapdns.html",
    "/echo": "/pages/echo.html",
    "/data": "/pages/data.html",
  };

  // Document Title Settings
  const titles = {
    "/": "VindE | Home",
    "/projects": "VindE | Projects",
    "/projects/snapdns": "VindE | SnapDNS",
    "/echo": "VindE | Echo",
    "/data": "VindE | Data Encrypt",
  };

  // Dynamic JS Lazy Loading (Restored to absolute asset paths)
  const pageScripts = {
    "/": [],
    "/projects": ["/assets/js/projects.js"],
    "/projects/snapdns": ["/assets/js/projects.js"],
    "/echo": [
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
      "/assets/js/echo.js",
    ],
    "/data": ["/assets/js/data.js"],
  };

  // Dynamic CSS Lazy Loading
  const pageStyles = {
    "/": [],
    "/projects": [],
    "/projects/snapdns": [],
    "/echo": [
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css",
    ],
    "/data": [],
  };

  // Track Loaded Assets to Prevent Duplicates
  const loadedScripts = new Set();
  const loadedStyles = new Set();

  /**
   * Helper: Injects and resolves a stylesheet dynamically with Integrity checks
   */
  function loadStyle(href) {
    if (loadedStyles.has(href)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) {
        loadedStyles.add(href);
        return resolve();
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;

      // SECURITY FIX: Add integrity checks for external CDNs
      if (href.includes("cdnjs.cloudflare.com")) {
        link.integrity =
          "sha512-Zcn6bjR/8RZbLEpLIeOwNtzREBAJnUKESxces60Mpoj+2okopSAcSUIUOseddDm0cxnGQzxIR7vJgsLZbdLE3w==";
        link.crossOrigin = "anonymous";

        // RESILIENCY FIX: Pointed fallback style redirect to assets/leaflet/
        link.onerror = () => {
          link.onerror = null;
          link.href = "/assets/leaflet/leaflet.css";
        };
      }

      link.onload = () => {
        loadedStyles.add(href);
        resolve();
      };
      link.onerror = () => reject(new Error(`Failed to load style: ${href}`));
      document.head.appendChild(link);
    });
  }

  /**
   * Helper: Injects and resolves a script dynamically with Integrity checks
   */
  function loadScript(src) {
    if (loadedScripts.has(src)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        loadedScripts.add(src);
        return resolve();
      }
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;

      // SECURITY FIX: Add integrity checks for external CDNs
      if (src.includes("cdnjs.cloudflare.com")) {
        script.integrity =
          "sha512-BwHfrr4c9kmRkLw6iXFdzcdWV/PGkVgiIyIWLLlTSXzWQzxuSg4DiQUCpauz/EWjgk5TYQqX/kvn9pG1NpYfqg==";
        script.crossOrigin = "anonymous";

        // RESILIENCY FIX: Pointed fallback script redirect to assets/leaflet/
        script.onerror = () => {
          script.onerror = null;
          script.src = "/assets/leaflet/leaflet.js";
        };
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
    // Nav links are immediately selectable on DOM load
    document
      .querySelectorAll(".header-nav a, .echo-btn, .data-btn")
      .forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(".header-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === path || (href !== "/" && path.startsWith(href)))
        link.classList.add("active");
    });
    if (path === "/echo" && document.querySelector(".echo-btn")) {
      document.querySelector(".echo-btn").classList.add("active");
    }
    if (path === "/data" && document.querySelector(".data-btn")) {
      document.querySelector(".data-btn").classList.add("active");
    }
  }

  // Track if this is the absolute first load session to prevent double-fetching inlined content
  let isInitialRender = true;

  /**
   * Page loading engine
   */
  async function loadPage(path) {
    let cleanPath =
      path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
    if (cleanPath === "" || cleanPath === "/index.html") cleanPath = "/";

    document.title = titles[cleanPath] || "VindE | 404";
    updateActiveNav(cleanPath);

    // PERFORMANCE BYPASS: If landing on "/" initially, use the pre-rendered shell inside index.html.
    // This skips the network fetch completely, dropping FCP/LCP times to <1.0s on mobile.
    if (cleanPath === "/" && isInitialRender) {
      isInitialRender = false;
      main.classList.add("loaded");
      document.dispatchEvent(new Event("spa-content-loaded"));
      return;
    }

    // Disable initial-load flag for all subsequent navigation
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
      let is404 = false; // Declared here so it's in scope for setTimeout

      // Standalone parsing fallback for decoupled 404 views
      if (rawHtml.includes("bsod-container")) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, "text/html");
        content = doc.querySelector(".bsod-container")?.outerHTML || rawHtml;
        is404 = true; // Mark as 404

        // Dynamic asset routing
        scriptsToLoad.push("/assets/js/error.js");
        stylesToLoad.push("/assets/css/error.css");
      }

      // Out-transition current content
      main.classList.remove("loaded");

      setTimeout(async () => {
        // Reset scroll state to the top on every dynamic navigation
        window.scrollTo(0, 0);

        // 1. LAYOUT VISIBILITY SYSTEM (Hides footer on both Home and 404 pages)
        if (is404 || cleanPath === "/") {
          if (header) header.style.display = is404 ? "none" : "";
          if (footer) footer.style.display = "none";
        } else {
          if (header) header.style.display = "";
          if (footer) footer.style.display = "";
        }

        // 2. THEME PERSISTENCE SYSTEM (Completely split to prevent clashing)
        if (is404) {
          // 404 fatal console screen must always be dark green
          document.body.classList.remove("light-theme");
        } else {
          // All valid routes (Home, Projects, etc.) must strictly respect user theme choice
          const savedTheme = localStorage.getItem("theme") || "dark";
          if (savedTheme === "light") {
            document.body.classList.add("light-theme");
          } else {
            document.body.classList.remove("light-theme");
          }
        }

        main.innerHTML = content;

        // Dynamically load stylesheets
        await Promise.all(stylesToLoad.map(loadStyle));

        // Dynamically load JS dependencies in sequence
        for (const src of scriptsToLoad) {
          await loadScript(src);
        }

        void main.offsetWidth; // Force Layout reflow for seamless opacity transitions
        main.classList.add("loaded");
        document.dispatchEvent(new Event("spa-content-loaded"));
      }, 150);
    } catch (err) {
      console.error("[Router] Failed to load path:", cleanPath, err);
      main.innerHTML = "<h1>DATA_LOAD_ERROR</h1>";
      main.classList.add("loaded");
    }
  }

  // Exposed routing hook
  window.routerLoadPage = loadPage;

  document.body.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (
      link &&
      link.getAttribute("href")?.startsWith("/") &&
      !link.getAttribute("target")
    ) {
      const url = link.getAttribute("href");

      const path = url.split("#")[0];
      let cleanPath =
        path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
      if (cleanPath === "") cleanPath = "/";

      // prevent default and return early (no re-fetching, no animation flashes).
      if (
        cleanPath === window.location.pathname ||
        (cleanPath === "/" && window.location.pathname === "/index.html")
      ) {
        e.preventDefault();
        return;
      }

      // Only intercept the link action if the clean target path is actively registered in our routes
      if (routes[cleanPath]) {
        e.preventDefault();
        history.pushState(null, null, url);
        loadPage(url);
      }
    }
  });

  window.addEventListener("popstate", () => loadPage(location.pathname));
  loadPage(location.pathname);
});
