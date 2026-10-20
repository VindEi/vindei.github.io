document.addEventListener("DOMContentLoaded", () => {
  const GITHUB_USERNAME = "VindEi";
  const CACHE_KEY = "vinde_gh_events";
  const CACHE_TIME = "vinde_gh_events_time";
  const CACHE_DURATION = 30 * 60 * 1000;

  const syncThemeDisplay = () => {
    const isLight = document.body.classList.contains("light-theme");
    const toggleIcon = document.querySelector("#theme-toggle i");
    if (toggleIcon) {
      toggleIcon.className = isLight ? "fas fa-sun fa-fw" : "fas fa-moon fa-fw";
    }

    const logoImg = document.querySelector(".header-left img.logo");
    if (logoImg) {
      const base = window.routerBasePath || "";
      logoImg.src = isLight
        ? `${base}/assets/img/logo-light.svg`
        : `${base}/assets/img/logo.svg`;
    }
  };

  const initialTheme = localStorage.getItem("theme") || "dark";
  document.body.classList.toggle("light-theme", initialTheme === "light");
  syncThemeDisplay();
  document.body.classList.add("loaded");

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#theme-toggle");
    if (!btn) return;

    const isLight = document.body.classList.toggle("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    syncThemeDisplay();

    document.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: { theme: isLight ? "light" : "dark" },
      }),
    );
  });

  const fetchGitHubContributions = async () => {
    const grid = document.querySelector(".github-grid");
    if (!grid) return;

    const now = Date.now();
    const cachedTime = localStorage.getItem(CACHE_TIME);
    let events = null;

    if (cachedTime && now - parseInt(cachedTime, 10) < CACHE_DURATION) {
      try {
        events = JSON.parse(localStorage.getItem(CACHE_KEY));
      } catch (err) {
        events = null;
      }
    }

    if (!events) {
      try {
        const res = await fetch(
          `https://api.github.com/users/${GITHUB_USERNAME}/events`,
        );
        if (!res.ok) throw new Error(`HTTP_${res.status}`);
        events = await res.json();
        localStorage.setItem(CACHE_KEY, JSON.stringify(events));
        localStorage.setItem(CACHE_TIME, now.toString());
      } catch (err) {
        return;
      }
    }

    if (!Array.isArray(events)) return;

    const days = Array(20).fill(0);
    const nowDate = new Date();

    events.forEach((event) => {
      if (event.created_at) {
        const eventDate = new Date(event.created_at);
        const diffDays = Math.floor(
          Math.abs(nowDate - eventDate) / (1000 * 60 * 60 * 24),
        );

        if (diffDays < 20) {
          const count =
            event.type === "PushEvent" && event.payload?.commits
              ? event.payload.commits.length
              : 1;
          days[19 - diffDays] += count;
        }
      }
    });

    const squares = grid.querySelectorAll(".git-sq");
    squares.forEach((sq, index) => {
      const count = days[index] || 0;
      let level = "off";
      if (count > 0 && count <= 2) level = "low";
      else if (count > 2 && count <= 5) level = "medium";
      else if (count > 5 && count <= 8) level = "high";
      else if (count > 8) level = "max";

      sq.className = `git-sq ${level}`;
      sq.setAttribute(
        "title",
        `${count} event${count !== 1 ? "s" : ""} (${index === 19 ? "today" : index === 18 ? "yesterday" : `${19 - index} days ago`})`,
      );
    });
  };

  document.addEventListener("spa-content-loaded", fetchGitHubContributions);
  fetchGitHubContributions();
});
