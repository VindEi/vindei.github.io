/**
 * Single Page Application Router
 */
document.addEventListener("DOMContentLoaded", () => {
  const main = document.getElementById("page-content");

  // SPA Route Mappings
  const routes = {
    "/": "/pages/home.html",
    "/projects": "/pages/projects.html",
    "/projects/snapdns": "/pages/projects/snapdns.html",
    "/tools/echo": "/pages/tools/echo.html",
    "/tools/data": "/pages/tools/data.html",
  };

  const titles = {
    "/": "VindE | Home",
    "/projects": "VindE | Projects",
    "/projects/snapdns": "VindE | SnapDNS",
    "/tools/echo": "VindE | Echo",
    "/tools/data": "VindE | Data Encrypt",
  };

  // Modular JS Loading
  const pageScripts = {
    "/": [],
    "/projects": ["/assets/js/projects/projects.js"],
    "/projects/snapdns": ["/assets/js/projects/snapdns.js"],
    "/tools/echo": [
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
      "/assets/js/tools/echo.js",
    ],
    "/tools/data": ["/assets/js/tools/data.js"],
  };

  // Modular CSS Loading
  const pageStyles = {
    "/": [],
    "/projects": ["/assets/css/projects/projects.css"],
    "/projects/snapdns": ["/assets/css/projects/snapdns.css"],
    "/tools/echo": [
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css",
      "/assets/css/tools/echo.css",
    ],
    "/tools/data": ["/assets/css/tools/data.css"],
  };

  const loadedScripts = new Set();
  const loadedStyles = new Set();

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

      if (href.includes("cdnjs.cloudflare.com")) {
        link.integrity =
          "sha512-Zcn6bjR/8RZbLEpLIeOwNtzREBAJnUKESxces60Mpoj+2okopSAcSUIUOseddDm0cxnGQzxIR7vJgsLZbdLE3w==";
        link.crossOrigin = "anonymous";
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

      if (src.includes("cdnjs.cloudflare.com")) {
        script.integrity =
          "sha512-BwHfrr4c9kmRkLw6iXFdzcdWV/PGkVgiIyIWLLlTSXzWQzxuSg4DiQUCpauz/EWjgk5TYQqX/kvn9pG1NpYfqg==";
        script.crossOrigin = "anonymous";
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
    document
      .querySelectorAll(".header-nav a, .echo-btn, .data-btn")
      .forEach((el) => el.classList.remove("active"));

    document.querySelectorAll(".header-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === path || (href !== "/" && path.startsWith(href))) {
        link.classList.add("active");
      }
    });

    if (path === "/tools/echo" && document.querySelector(".echo-btn")) {
      document.querySelector(".echo-btn").classList.add("active");
    }
    if (path === "/tools/data" && document.querySelector(".data-btn")) {
      document.querySelector(".data-btn").classList.add("active");
    }
  }

  let isInitialRender = true;

  async function loadPage(path) {
    const rawPath = path.split("#")[0];
    let cleanPath =
      rawPath.length > 1 && rawPath.endsWith("/")
        ? rawPath.slice(0, -1)
        : rawPath;
    if (cleanPath === "" || cleanPath === "/index.html") cleanPath = "/";

    document.title = titles[cleanPath] || "VindE | 404";
    updateActiveNav(cleanPath);

    if (cleanPath === "/" && isInitialRender) {
      isInitialRender = false;
      main.classList.add("loaded");
      document.dispatchEvent(new Event("spa-content-loaded"));
      return;
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

      setTimeout(async () => {
        window.scrollTo(0, 0);

        if (is404 || cleanPath === "/") {
          if (header) header.style.display = is404 ? "none" : "";
          if (footer) footer.style.display = "none";
        } else {
          if (header) header.style.display = "";
          if (footer) footer.style.display = "";
        }

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

        main.innerHTML = content;

        await Promise.all(stylesToLoad.map(loadStyle));

        for (const src of scriptsToLoad) {
          await loadScript(src);
        }

        void main.offsetWidth;
        main.classList.add("loaded");
        document.dispatchEvent(new Event("spa-content-loaded"));
      }, 150);
    } catch (err) {
      console.error("[Router] Failed to load path:", cleanPath, err);
      main.innerHTML = "<h1>DATA_LOAD_ERROR</h1>";
      main.classList.add("loaded");
    }
  }

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
  loadPage(location.pathname);
});
