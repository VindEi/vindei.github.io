/**
 * VindE - Number Generator & Choice Wheel
 */

(function () {
  "use strict";

  /* ==========================================================================
     PER-DAY HISTORY ENGINE
     ========================================================================== */

  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatDayLabel(dateStr) {
    const today = getTodayKey();
    if (dateStr === today) return "Today";

    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (dateStr === yesterday) return "Yesterday";

    const parts = dateStr.split("-");
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  function saveToHistory(storageKey, val) {
    let hist = {};
    try {
      hist = JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch (e) {
      hist = {};
    }
    const today = getTodayKey();
    if (!hist[today]) hist[today] = [];
    hist[today].unshift(val);

    if (hist[today].length > 40) hist[today].pop();
    const keys = Object.keys(hist).sort().reverse();
    if (keys.length > 7) {
      delete hist[keys[keys.length - 1]];
    }

    localStorage.setItem(storageKey, JSON.stringify(hist));
  }

  function renderDailyHistory(containerId, storageKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let hist = {};
    try {
      hist = JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch (e) {
      hist = {};
    }

    const dates = Object.keys(hist).sort().reverse();
    if (dates.length === 0 || dates.every((d) => hist[d].length === 0)) {
      container.innerHTML = `<span class="history-empty">No history recorded yet.</span>`;
      return;
    }

    container.innerHTML = "";
    dates.forEach((d) => {
      const items = hist[d];
      if (!items || items.length === 0) return;

      const group = document.createElement("div");
      group.className = "history-day-group";

      const title = document.createElement("span");
      title.className = "history-day-title";
      title.innerText = formatDayLabel(d);
      group.appendChild(title);

      const chips = document.createElement("div");
      chips.className = "history-chips";
      items.forEach((itemVal) => {
        const chip = document.createElement("span");
        chip.className = "history-chip";
        chip.innerText = itemVal;
        chips.appendChild(chip);
      });
      group.appendChild(chips);

      container.appendChild(group);
    });
  }

  /* ==========================================================================
     MODULE 1: NUMBER GENERATOR
     ========================================================================== */

  function getSecureRandomInt(min, max) {
    const range = max - min + 1;
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);
    const buffer = new Uint32Array(1);

    do {
      crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);

    return min + (buffer[0] % range);
  }

  function initGenerator() {
    const rollBtn = document.getElementById("rng-roll-btn");
    const clearBtn = document.getElementById("clear-rng-history-btn");
    if (!rollBtn) return;

    renderDailyHistory("rng-history", "vinde_rng_daily_history");

    if (clearBtn) {
      clearBtn.onclick = () => {
        localStorage.removeItem("vinde_rng_daily_history");
        renderDailyHistory("rng-history", "vinde_rng_daily_history");
      };
    }

    rollBtn.onclick = () => {
      const min = parseInt(document.getElementById("rng-min").value, 10) || 1;
      const max = parseInt(document.getElementById("rng-max").value, 10) || 3;

      if (min >= max) {
        alert("Min must be less than Max.");
        return;
      }

      rollBtn.disabled = true;
      const out = document.getElementById("rng-output");

      let frames = 0;
      const ticker = setInterval(() => {
        out.innerText = Math.floor(Math.random() * (max - min + 1)) + min;
        frames++;
        if (frames > 8) {
          clearInterval(ticker);
          const finalVal = getSecureRandomInt(min, max);
          out.innerText = finalVal;
          rollBtn.disabled = false;
          saveToHistory("vinde_rng_daily_history", String(finalVal));
          renderDailyHistory("rng-history", "vinde_rng_daily_history");
        }
      }, 30);
    };
  }

  /* ==========================================================================
     MODULE 2: WHEEL SPINNER (Default 1, 2, 3)
     ========================================================================== */

  let canvas, ctx;
  let slices = ["1", "2", "3"];
  let currentAngle = 0;
  let angularVelocity = 0;
  let isSpinning = false;
  let winningIndex = null;

  const paletteDark = [
    "#12141d",
    "#181b26",
    "#1f2332",
    "#262c3e",
    "#161924",
    "#222838",
  ];

  const paletteLight = [
    "#ffffff",
    "#f0f2f7",
    "#e2e6ef",
    "#d5dae6",
    "#ebeef5",
    "#dfe4ee",
  ];

  function setupDPI() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const size = rect.width || 360;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
  }

  function initSpinner() {
    canvas = document.getElementById("wheel-canvas");
    if (!canvas) return;

    setupDPI();
    bindSliceUI();
    drawWheel();
    renderDailyHistory("wheel-history", "vinde_wheel_daily_history");

    const clearWheelBtn = document.getElementById("clear-wheel-history-btn");
    if (clearWheelBtn) {
      clearWheelBtn.onclick = () => {
        localStorage.removeItem("vinde_wheel_daily_history");
        renderDailyHistory("wheel-history", "vinde_wheel_daily_history");
      };
    }

    const spinBtn = document.getElementById("wheel-spin-btn");
    spinBtn.onclick = () => {
      if (isSpinning || slices.length < 2) return;
      isSpinning = true;
      spinBtn.disabled = true;
      winningIndex = null;
      document.getElementById("wheel-result-banner").innerText = "Spinning...";

      angularVelocity = Math.random() * 0.2 + 0.32;
      requestAnimationFrame(spinAnimationLoop);
    };

    window.addEventListener("resize", () => {
      if (document.getElementById("wheel-canvas")) {
        setupDPI();
        drawWheel();
      }
    });
  }

  function spinAnimationLoop() {
    currentAngle += angularVelocity;
    angularVelocity *= 0.987;

    drawWheel();

    if (angularVelocity > 0.0008) {
      requestAnimationFrame(spinAnimationLoop);
    } else {
      isSpinning = false;
      document.getElementById("wheel-spin-btn").disabled = false;
      evaluateWinner();
      drawWheel();
    }
  }

  function evaluateWinner() {
    const arc = (Math.PI * 2) / slices.length;
    let normalized = currentAngle % (Math.PI * 2);
    let pointerAngle = (Math.PI * 1.5 - normalized) % (Math.PI * 2);
    if (pointerAngle < 0) pointerAngle += Math.PI * 2;

    winningIndex = Math.floor(pointerAngle / arc);
    const winner = slices[winningIndex];
    document.getElementById("wheel-result-banner").innerText =
      `Result: ${winner}`;

    saveToHistory("vinde_wheel_daily_history", winner);
    renderDailyHistory("wheel-history", "vinde_wheel_daily_history");
  }

  function drawWheel() {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.width / dpr;
    const cx = size / 2;
    const cy = size / 2;
    const radius = cx - 8;
    const arc = (Math.PI * 2) / slices.length;
    const isLight = document.body.classList.contains("light-theme");
    const colors = isLight ? paletteLight : paletteDark;

    ctx.clearRect(0, 0, size, size);

    slices.forEach((slice, i) => {
      const angle = currentAngle + i * arc;
      const isWinner = !isSpinning && winningIndex === i;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + arc);
      ctx.closePath();

      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      ctx.strokeStyle = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (isWinner) {
        ctx.strokeStyle = "#ffc107";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = isWinner ? "#ffc107" : isLight ? "#0d0e12" : "#e8eaf0";
      ctx.font = isWinner
        ? "bold 15px 'Plus Jakarta Sans', sans-serif"
        : "600 13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(slice, radius - 20, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? "#f4f5f8" : "#07080a";
    ctx.fill();
    ctx.strokeStyle = isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffc107";
    ctx.fill();
  }

  function bindSliceUI() {
    const list = document.getElementById("slice-list");
    const input = document.getElementById("slice-input");
    const addBtn = document.getElementById("slice-add-btn");

    const renderList = () => {
      list.innerHTML = "";
      slices.forEach((text, idx) => {
        const item = document.createElement("div");
        item.className = "slice-item";
        item.innerHTML = `
          <span>${text}</span>
          <button class="slice-del-btn hover-target" data-idx="${idx}" type="button"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(item);
      });

      list.querySelectorAll(".slice-del-btn").forEach((b) => {
        b.onclick = () => {
          if (slices.length <= 2) {
            alert("Need at least 2 options.");
            return;
          }
          slices.splice(parseInt(b.dataset.idx, 10), 1);
          winningIndex = null;
          renderList();
          drawWheel();
        };
      });
    };

    addBtn.onclick = () => {
      const val = input.value.trim();
      if (!val) return;
      if (slices.length >= 16) {
        alert("Maximum 16 options.");
        return;
      }
      slices.push(val);
      input.value = "";
      winningIndex = null;
      renderList();
      drawWheel();
    };

    input.onkeydown = (e) => {
      if (e.key === "Enter") addBtn.click();
    };

    renderList();
  }

  function initTabs() {
    const tabGen = document.getElementById("tab-btn-generator");
    const tabSpin = document.getElementById("tab-btn-spinner");
    const viewGen = document.getElementById("rng-generator-view");
    const viewSpin = document.getElementById("rng-spinner-view");

    if (!tabGen || !tabSpin) return;

    tabGen.onclick = () => {
      tabGen.classList.add("active");
      tabSpin.classList.remove("active");
      viewGen.classList.add("active");
      viewSpin.classList.remove("active");
    };

    tabSpin.onclick = () => {
      tabSpin.classList.add("active");
      tabGen.classList.remove("active");
      viewSpin.classList.add("active");
      viewGen.classList.remove("active");
      setupDPI();
      drawWheel();
    };
  }

  function initModule() {
    initTabs();
    initGenerator();
    initSpinner();
  }

  document.addEventListener("spa-content-loaded", initModule);
  document.addEventListener("DOMContentLoaded", initModule);
})();
