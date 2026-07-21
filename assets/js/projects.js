/**
 * Renders the Detail Panel in the Projects List
 */
function renderDetail(card, detailContainer) {
  // 1. Visual Active State
  document
    .querySelectorAll(".project-card")
    .forEach((c) => c.classList.remove("active"));
  card.classList.add("active");

  // 2. Extract Data
  const {
    title,
    desc,
    github,
    download,
    status,
    productPage,
    license,
    type,
    platform,
    icon,
  } = card.dataset;

  // 3. Status Badge Logic
  const statusHTML =
    status === "wip" ? "🚧 Work in Progress" : "✅ Stable Release";
  const statusClass = status === "wip" ? "wip" : "stable";

  // 4. Action Buttons Logic
  let mainActionBtn = "";
  if (productPage) {
    mainActionBtn = `<a href="${productPage}" class="btn-action primary">View Product Page <i class="fas fa-arrow-right"></i></a>`;
  } else {
    const isDisabled = status === "wip" || !download || download === "#";
    mainActionBtn = isDisabled
      ? `<span class="btn-action disabled">Download <i class="fas fa-lock"></i></span>`
      : `<a href="${download}" target="_blank" rel="noopener noreferrer" class="btn-action primary">Download <i class="fas fa-download"></i></a>`;
  }

  const githubBtn =
    github && github !== "#"
      ? `<a href="${github}" target="_blank" rel="noopener noreferrer" class="btn-action">GitHub <i class="fab fa-github"></i></a>`
      : ``;

  // 5. Render to DOM (Cleaned up manual reflow lines to keep execution lightweight)
  detailContainer.innerHTML = `
    <div class="fade-in">
      <div class="detail-header">
        <h3><span style="margin-right:10px;">${icon || ""}</span>${title}</h3>
        <p class="subtitle ${statusClass}">${statusHTML}</p> 
        
        <div class="tags-row">
          ${license ? `<span class="tag-pill license">${license}</span>` : ""}
          ${type ? `<span class="tag-pill type">${type}</span>` : ""}
          ${platform ? `<span class="tag-pill platform">${platform}</span>` : ""}
        </div>
      </div>
      
      <p>${desc}</p>
      
      <div class="detail-actions">
        ${mainActionBtn}
        ${githubBtn}
      </div>
    </div>
  `;
}

/**
 * LOGIC 1: Projects List Page
 */
function initProjectList() {
  const grid = document.querySelector(".projects-grid");
  const detailContainer = document.getElementById("project-detail");

  if (!grid || !detailContainer) return;

  // Click Event
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".project-card");
    if (card) {
      if (card.classList.contains("active")) return;
      
      renderDetail(card, detailContainer);

      if (window.innerWidth <= 1100) {
        detailContainer.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  // Keyboard Event (Enter/Space to select)
  grid.addEventListener("keydown", (e) => {
    const card = e.target.closest(".project-card");
    if (!card) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (card.classList.contains("active")) return;

      renderDetail(card, detailContainer);

      if (window.innerWidth <= 1100) {
        detailContainer.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  // Init first card
  const first = grid.querySelector(".project-card");
  if (first) renderDetail(first, detailContainer);
}

/**
 * Dynamic GitHub Release Tag Fetcher for SnapDNS
 */
async function syncLatestSnapDNSVersion() {
  const modal = document.getElementById("download-modal");
  if (!modal) return;

  try {
    // Query the latest public release from the GitHub repository API
    const response = await fetch(
      "https://api.github.com/repos/VindEi/SnapDNS/releases/latest",
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const latestTag = data.tag_name; // e.g., "v2.1.0" or "v3.0.0"

    if (!latestTag) return;

    // Dynamically update the download paths inside the selection columns
    const modalLinks = modal.querySelectorAll(".modal-item");
    modalLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.includes("/releases/download/")) {
        // Regex matches the target segment between "/releases/download/" and the filename
        const newHref = href.replace(
          /\/releases\/download\/[^/]+\//,
          `/releases/download/${latestTag}/`,
        );
        link.setAttribute("href", newHref);
      }
    });

    // Render an interactive version pill badge inside the modal header
    const modalHeader = modal.querySelector(".modal-header h2");
    if (modalHeader && !modalHeader.querySelector(".ver-badge")) {
      const badge = document.createElement("span");
      badge.className = "tag-pill type ver-badge";
      badge.style.marginLeft = "12px";
      badge.style.fontSize = "0.75rem";
      badge.innerText = latestTag;
      modalHeader.appendChild(badge);
    }
  } catch (error) {
    console.warn(
      "[SnapDNS] Failed to fetch latest version dynamically. Default fallback active:",
      error,
    );
  }
}

/**
 * LOGIC 2: SnapDNS Product Page (Symmetrical Modal and UX Memory Cleanup)
 */
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

    // Toggle Modal Open
    dbtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.add("open");
      document.addEventListener("keydown", handleEscapeKey);
    });

    // Close on Modal Exit Icon Click
    if (closeModal) {
      closeModal.addEventListener("click", () => {
        modal.classList.remove("open");
        document.removeEventListener("keydown", handleEscapeKey);
      });
    }

    // Close on Backdrop Click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("open");
        document.removeEventListener("keydown", handleEscapeKey);
      }
    });

    // TRIGGER DYNAMIC LOOKUP: Fetch and bind latest version details
    syncLatestSnapDNSVersion();
  }
}

/**
 * Dynamic Project Category Sorter & Sidebar Wireframe Engine
 */
function renderProjectGroups() {
  const grid = document.querySelector(".projects-grid");
  const sidebar = document.getElementById("projects-sidebar");
  if (!grid || !sidebar) return;

  // Clear previous sidebar elements
  sidebar.innerHTML = "";

  const cards = Array.from(grid.querySelectorAll(".project-card"));
  if (cards.length === 0) return;

  // Map database properties to brief category keywords
  const mapGroupType = (type) => {
    if (type === "Website") return "WEB";
    if (type === "Game") return "GAME";
    if (type === "Script") return "SCRIPT";
    return "APP"; // Default categorization for Software
  };

  // Group consecutive duplicates
  const blocks = [];
  let currentBlock = null;

  cards.forEach((card, index) => {
    const groupName = mapGroupType(card.dataset.type);

    if (!currentBlock || currentBlock.name !== groupName) {
      currentBlock = {
        name: groupName,
        cards: [card]
      };
      blocks.push(currentBlock);
    } else {
      currentBlock.cards.push(card);
    }
  });

  // Calculate coordinates & render structural indicators
  blocks.forEach(block => {
    const groupBlock = document.createElement("div");
    groupBlock.className = "sidebar-group-block";

    const firstCard = block.cards[0];
    const lastCard = block.cards[block.cards.length - 1];

    // Read exact DOM offset dimensions from the rendered cards
    const topPos = firstCard.offsetTop;
    const bottomPos = lastCard.offsetTop + lastCard.offsetHeight;
    const blockHeight = bottomPos - topPos;

    // Apply absolute positions
    groupBlock.style.position = "absolute";
    groupBlock.style.top = `${topPos}px`;
    groupBlock.style.height = `${blockHeight}px`;

    // Rotated label & line HTML layout
    groupBlock.innerHTML = `
      <div class="group-line-wrapper">
        <div class="group-line"></div>
        <div class="group-label">
          <span>${block.name}</span>
        </div>
      </div>
    `;

    sidebar.appendChild(groupBlock);
  });
}

/**
 * Main Initializer (Route Dispatcher)
 */
function initProjectsHandler() {
  if (document.querySelector(".projects-grid")) {
    initProjectList();
    
    // PERFORMANCE DELAY: Give the SPA router transition 200ms to complete mounting the 
    // HTML in the viewport before measuring offsets.
    setTimeout(renderProjectGroups, 200);
  } else if (document.querySelector(".product-visual")) {
    initSnapDNS();
  }
}

// Recalculate dimensions dynamically during browser window resizes
window.addEventListener("resize", () => {
  if (document.querySelector(".projects-grid")) {
    renderProjectGroups();
  }
});

// Attach to Router Events
document.addEventListener("spa-content-loaded", initProjectsHandler);
document.addEventListener("DOMContentLoaded", initProjectsHandler);
