/**
 * VindE - Projects Dashboard Handler
 */

function renderDetail(card, detailContainer) {
  document
    .querySelectorAll(".project-card")
    .forEach((c) => c.classList.remove("active"));
  card.classList.add("active");

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

  const statusHTML =
    status === "wip" ? "🚧 Work in Progress" : "✅ Stable Release";
  const statusClass = status === "wip" ? "wip" : "stable";

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

function initProjectList() {
  const grid = document.querySelector(".projects-grid");
  const detailContainer = document.getElementById("project-detail");
  if (!grid || !detailContainer) return;

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

  const first = grid.querySelector(".project-card");
  if (first) renderDetail(first, detailContainer);
}

function renderProjectGroups() {
  const grid = document.querySelector(".projects-grid");
  const sidebar = document.getElementById("projects-sidebar");
  if (!grid || !sidebar) return;

  sidebar.innerHTML = "";
  const cards = Array.from(grid.querySelectorAll(".project-card"));
  if (cards.length === 0) return;

  const mapGroupType = (type) => {
    if (type === "Website") return "WEB";
    if (type === "Game") return "GAME";
    if (type === "Script") return "SCRIPT";
    return "APP";
  };

  const blocks = [];
  let currentBlock = null;

  cards.forEach((card) => {
    const groupName = mapGroupType(card.dataset.type);
    if (!currentBlock || currentBlock.name !== groupName) {
      currentBlock = { name: groupName, cards: [card] };
      blocks.push(currentBlock);
    } else {
      currentBlock.cards.push(card);
    }
  });

  blocks.forEach((block) => {
    const groupBlock = document.createElement("div");
    groupBlock.className = "sidebar-group-block";
    const firstCard = block.cards[0];
    const lastCard = block.cards[block.cards.length - 1];

    const topPos = firstCard.offsetTop;
    const bottomPos = lastCard.offsetTop + lastCard.offsetHeight;
    const blockHeight = bottomPos - topPos;

    groupBlock.style.position = "absolute";
    groupBlock.style.top = `${topPos}px`;
    groupBlock.style.height = `${blockHeight}px`;

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

function initProjectsDashboard() {
  if (document.querySelector(".projects-grid")) {
    initProjectList();
    setTimeout(renderProjectGroups, 200);
  }
}

window.addEventListener("resize", () => {
  if (document.querySelector(".projects-grid")) {
    renderProjectGroups();
  }
});

document.addEventListener("spa-content-loaded", initProjectsDashboard);
document.addEventListener("DOMContentLoaded", initProjectsDashboard);
