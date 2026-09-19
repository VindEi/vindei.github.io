/**
 * Global Site Initialization
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Theme Persistence
  const savedTheme = localStorage.getItem("theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
  }

  const syncThemeIcon = () => {
    const btn = document.querySelector("#theme-toggle i");
    if (!btn) return;
    btn.className = document.body.classList.contains("light-theme")
      ? "fas fa-sun"
      : "fas fa-moon";
  };

  const initializeComponents = () => {
    document.body.classList.add("loaded");
    syncThemeIcon();
    window.dispatchEvent(new Event("componentsLoaded"));
  };

  initializeComponents();

  // 2. Theme Toggle Listener
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#theme-toggle");
    if (!btn) return;

    const isLight = document.body.classList.toggle("light-theme");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    syncThemeIcon();

    document.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: { theme: isLight ? "light" : "dark" },
      }),
    );
  });

  // 3. Dynamic GitHub contributions tracker with 30-minute LocalStorage Caching
  const fetchGitHubContributions = async () => {
    const grid = document.querySelector(".github-grid");
    if (!grid) return;

    const CACHE_KEY = "vinde_gh_events";
    const CACHE_TIME = "vinde_gh_events_time";
    const now = Date.now();
    const cachedTime = localStorage.getItem(CACHE_TIME);
    let events = null;

    if (cachedTime && now - parseInt(cachedTime, 10) < 30 * 60 * 1000) {
      try {
        events = JSON.parse(localStorage.getItem(CACHE_KEY));
      } catch (e) {
        events = null;
      }
    }

    if (!events) {
      try {
        const res = await fetch("https://api.github.com/users/VindEi/events");
        if (!res.ok) throw new Error("HTTP_ERR_OR_LIMIT");
        events = await res.json();
        localStorage.setItem(CACHE_KEY, JSON.stringify(events));
        localStorage.setItem(CACHE_TIME, now.toString());
      } catch (err) {
        console.warn("[GitHub Grid] Standard fallback active:", err);
        return;
      }
    }

    const days = Array(20).fill(0);
    const nowDate = new Date();

    events.forEach((event) => {
      if (event.created_at) {
        const eventDate = new Date(event.created_at);
        const diffTime = Math.abs(nowDate - eventDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 20) {
          if (event.type === "PushEvent" && event.payload?.commits) {
            days[19 - diffDays] += event.payload.commits.length;
          } else {
            days[19 - diffDays] += 1;
          }
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
        `${count} contribution${count !== 1 ? "s" : ""} on Day ${index + 1}`,
      );
    });
  };

  document.addEventListener("spa-content-loaded", fetchGitHubContributions);
  document.addEventListener("componentsLoaded", fetchGitHubContributions);
});
