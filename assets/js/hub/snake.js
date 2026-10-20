(function () {
  "use strict";

  let canvas, ctx;
  let loopTimeout = null;
  let isRunning = false;
  let isPaused = false;
  let hasTurnedThisTick = false;

  const GRID_SIZE = 20;
  const CELL_COUNT = 20;

  let snake = [];
  let food = { x: 15, y: 15 };
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let score = 0;
  let bestScore = 0;
  let tickRate = 110;

  try {
    bestScore = parseInt(localStorage.getItem("vinde_snake_best") || "0", 10);
  } catch (e) {
    bestScore = 0;
  }

  function initEngine() {
    canvas = document.getElementById("snake-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    const bestEl = document.getElementById("snake-best");
    if (bestEl) bestEl.innerText = bestScore;

    bindEvents();
    render();
  }

  function startGame() {
    const overlay = document.getElementById("snake-overlay");
    if (overlay) overlay.classList.remove("active");
    const dot = document.getElementById("snake-status-dot");
    if (dot) dot.style.background = "#4caf50";
    const status = document.getElementById("snake-status-text");
    if (status) status.innerText = "Playing";

    resetGame();
    isRunning = true;
    isPaused = false;
    clearTimeout(loopTimeout);
    loopTimeout = setTimeout(update, tickRate);
  }

  function resetGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    hasTurnedThisTick = false;
    score = 0;
    const scoreEl = document.getElementById("snake-score");
    if (scoreEl) scoreEl.innerText = "0";
    spawnFood();
  }

  function spawnFood() {
    let valid = false;
    while (!valid) {
      food = {
        x: Math.floor(Math.random() * CELL_COUNT),
        y: Math.floor(Math.random() * CELL_COUNT),
      };
      valid = !snake.some((seg) => seg.x === food.x && seg.y === food.y);
    }
  }

  function update() {
    if (!isRunning || isPaused) return;

    dir = { ...nextDir };
    hasTurnedThisTick = false;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (
      head.x < 0 ||
      head.x >= CELL_COUNT ||
      head.y < 0 ||
      head.y >= CELL_COUNT
    ) {
      triggerGameOver("You hit a wall!");
      return;
    }

    if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
      triggerGameOver("You ran into yourself!");
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      const scoreEl = document.getElementById("snake-score");
      if (scoreEl) scoreEl.innerText = score;

      if (score > bestScore) {
        bestScore = score;
        try {
          localStorage.setItem("vinde_snake_best", bestScore.toString());
        } catch (e) {}
        const bestEl = document.getElementById("snake-best");
        if (bestEl) bestEl.innerText = bestScore;
      }
      spawnFood();
    } else {
      snake.pop();
    }

    render();
    loopTimeout = setTimeout(update, tickRate);
  }

  function render() {
    if (!canvas || !ctx) return;
    const isLight = document.body.classList.contains("light-theme");

    ctx.fillStyle = isLight ? "#e1e4ea" : "#050608";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= CELL_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(canvas.width, i * GRID_SIZE);
      ctx.stroke();
    }

    ctx.fillStyle = "#ff3b5c";
    ctx.fillRect(
      food.x * GRID_SIZE + 3,
      food.y * GRID_SIZE + 3,
      GRID_SIZE - 6,
      GRID_SIZE - 6,
    );

    snake.forEach((seg, index) => {
      ctx.fillStyle =
        index === 0
          ? isLight
            ? "#ffb300"
            : "#ffc107"
          : isLight
            ? "#11131a"
            : "#f4f5f8";
      ctx.fillRect(
        seg.x * GRID_SIZE + 1,
        seg.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
      );
    });
  }

  function triggerGameOver(reason) {
    isRunning = false;
    clearTimeout(loopTimeout);
    const dot = document.getElementById("snake-status-dot");
    if (dot) dot.style.background = "#ff3b5c";
    const status = document.getElementById("snake-status-text");
    if (status) status.innerText = "Game Over";

    const overlay = document.getElementById("snake-overlay");
    const title = document.getElementById("overlay-title");
    const desc = document.getElementById("overlay-desc");
    const actionBtn = document.getElementById("snake-action-btn");

    if (title) title.innerText = "Game Over";
    if (desc) desc.innerText = `${reason} Final Score: ${score}`;
    if (actionBtn)
      actionBtn.innerHTML = '<i class="fas fa-rotate-right"></i> Play Again';
    if (overlay) overlay.classList.add("active");
  }

  function handleDirectionInput(newX, newY) {
    if (!isRunning) {
      const title = document.getElementById("overlay-title");
      if (title && title.innerText === "Game Over") {
        return;
      }
      startGame();
    }
    if (hasTurnedThisTick) return;
    if (newX !== 0 && dir.x === -newX) return;
    if (newY !== 0 && dir.y === -newY) return;

    nextDir = { x: newX, y: newY };
    hasTurnedThisTick = true;
  }

  const handleKeyDown = (e) => {
    if (!document.getElementById("snake-canvas")) return;

    const key = e.key ? e.key.toLowerCase() : "";
    const code = e.code || "";

    const isUp =
      key === "w" || code === "KeyW" || key === "arrowup" || code === "ArrowUp";
    const isDown =
      key === "s" ||
      code === "KeyS" ||
      key === "arrowdown" ||
      code === "ArrowDown";
    const isLeft =
      key === "a" ||
      code === "KeyA" ||
      key === "arrowleft" ||
      code === "ArrowLeft";
    const isRight =
      key === "d" ||
      code === "KeyD" ||
      key === "arrowright" ||
      code === "ArrowRight";
    const isSpace = key === " " || code === "Space";

    if (isUp || isDown || isLeft || isRight || isSpace) {
      e.preventDefault();
    }

    if (isUp) handleDirectionInput(0, -1);
    else if (isDown) handleDirectionInput(0, 1);
    else if (isLeft) handleDirectionInput(-1, 0);
    else if (isRight) handleDirectionInput(1, 0);
    else if (isSpace) togglePause();
  };

  function bindEvents() {
    window.removeEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleKeyDown);

    document.querySelectorAll(".dpad-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        btn.blur();
        const d = btn.getAttribute("data-dir");
        if (d === "UP") handleDirectionInput(0, -1);
        if (d === "DOWN") handleDirectionInput(0, 1);
        if (d === "LEFT") handleDirectionInput(-1, 0);
        if (d === "RIGHT") handleDirectionInput(1, 0);
      };
    });

    let touchStartX = 0,
      touchStartY = 0;
    canvas.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true },
    );

    canvas.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
          if (Math.abs(dx) > 20) handleDirectionInput(dx > 0 ? 1 : -1, 0);
        } else {
          if (Math.abs(dy) > 20) handleDirectionInput(0, dy > 0 ? 1 : -1);
        }
      },
      { passive: true },
    );

    document.querySelectorAll(".speed-btn").forEach((btn) => {
      btn.onclick = () => {
        btn.blur();
        document
          .querySelectorAll(".speed-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        tickRate = parseInt(btn.getAttribute("data-speed"), 10);
      };
    });

    const actionBtn = document.getElementById("snake-action-btn");
    if (actionBtn) {
      actionBtn.onclick = () => {
        actionBtn.blur();
        startGame();
      };
    }

    const pauseBtn = document.getElementById("snake-pause-btn");
    if (pauseBtn) {
      pauseBtn.onclick = () => {
        pauseBtn.blur();
        togglePause();
      };
    }
  }

  function togglePause() {
    if (!isRunning) {
      startGame();
      return;
    }
    isPaused = !isPaused;
    const pauseBtn = document.getElementById("snake-pause-btn");
    const statusText = document.getElementById("snake-status-text");

    if (isPaused) {
      if (statusText) statusText.innerText = "Paused";
      if (pauseBtn)
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume Game';
    } else {
      if (statusText) statusText.innerText = "Playing";
      if (pauseBtn)
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Game';
      loopTimeout = setTimeout(update, tickRate);
    }
  }

  function cleanUp() {
    clearTimeout(loopTimeout);
    isRunning = false;
    isPaused = false;
    window.removeEventListener("keydown", handleKeyDown);
  }

  function handleRoute() {
    if (document.getElementById("snake-canvas")) {
      initEngine();
    } else {
      cleanUp();
    }
  }

  document.addEventListener("spa-content-loaded", handleRoute);
  document.addEventListener("themeChanged", () => {
    if (document.getElementById("snake-canvas")) render();
  });
})();
