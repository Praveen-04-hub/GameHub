const API_KEY = "a16085edbea84209b6b14f814ec052da";
const BASE_URL = "https://api.rawg.io/api/games";

let currentPage = 1;
let allGamesCache = [];

// 🔐 Auth protection
if (localStorage.getItem("loggedIn") !== "true") {
  window.location.href = "login.html";
}

// 🔄 Tab switching (UPDATED: render pages)
function switchTab(e, tab) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const target = document.getElementById(tab);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-links span").forEach(n => n.classList.remove("active"));
  if (e && e.target) e.target.classList.add("active");

  if (tab === "watchlist") renderWatchlistPage();
  if (tab === "reviews") renderReviewsPage();
}

// 🚪 Logout
function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}

// 🧠 Utility
function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function highlightText(text, query) {
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeQuery})`, "gi");
  return text.replace(regex, `<span style="color:#6c4cff;font-weight:bold;">$1</span>`);
}

function setGridMessage(message) {
  const grid = document.getElementById("gamesGrid");
  if (grid) {
    grid.innerHTML = `<p style="padding:20px;color:#bbb;">${message}</p>`;
  }
}

// 🎮 Render cards
function appendGames(list, containerId = "gamesGrid") {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  list.forEach(g => {
    const card = document.createElement("div");
    card.className = "card";

    const image = g.background_image || "https://via.placeholder.com/600x400?text=No+Image";

    card.innerHTML = `
      <img src="${image}" alt="${g.name}">
      <p>${g.name}</p>
    `;

    card.onclick = () => openModal(g.id);
    grid.appendChild(card);
  });
}

// 🚀 Load games + cache
async function loadGames(reset = true) {
  const grid = document.getElementById("gamesGrid");
  if (!grid) return;

  try {
    if (reset) {
      currentPage = 1;
      grid.innerHTML = "";
      allGamesCache = [];
    }

    const url = `${BASE_URL}?key=${API_KEY}&page=${currentPage}&page_size=40`;
    const res = await fetch(url);
    const data = await res.json();

    allGamesCache = [...allGamesCache, ...data.results];
    appendGames(data.results);

  } catch (err) {
    console.error(err);
    setGridMessage("Failed to load games.");
  }
}

// ➕ Load more
function loadMore() {
  currentPage++;
  loadGames(false);
}

// 🔍 SEARCH (unchanged)
async function searchGames() {
  const input = document.getElementById("search");
  const dropdown = document.getElementById("searchDropdown");
  const grid = document.getElementById("gamesGrid");

  const query = normalizeText(input.value);

  if (!query) {
    dropdown.classList.add("hidden");
    grid.innerHTML = "";
    appendGames(allGamesCache);
    return;
  }

  const localMatches = allGamesCache.filter(g =>
    normalizeText(g.name).includes(query)
  );

  if (localMatches.length > 0) {
    grid.innerHTML = "";
    appendGames(localMatches);

    dropdown.innerHTML = "";
    localMatches.slice(0, 8).forEach(game => {
      const div = document.createElement("div");
      div.className = "search-item";
      div.innerHTML = highlightText(game.name, query);

      div.onclick = () => {
        openModal(game.id);
        dropdown.classList.add("hidden");
        input.value = game.name;
      };

      dropdown.appendChild(div);
    });

    dropdown.classList.remove("hidden");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}?key=${API_KEY}&search=${query}&page_size=20`);
    const data = await res.json();
    const results = data.results || [];

    grid.innerHTML = "";
    appendGames(results);

    dropdown.innerHTML = "";

    results.slice(0, 8).forEach(game => {
      const div = document.createElement("div");
      div.className = "search-item";
      div.innerHTML = highlightText(game.name, query);

      div.onclick = () => {
        openModal(game.id);
        dropdown.classList.add("hidden");
        input.value = game.name;
      };

      dropdown.appendChild(div);
    });

    dropdown.classList.remove("hidden");

  } catch (err) {
    console.error(err);
  }
}

// 🔥 Trending
async function loadTrending() {
  const trendingRow = document.getElementById("trendingRow");
  const upcomingRow = document.getElementById("upcomingRow");

  if (!trendingRow || !upcomingRow) return;

  trendingRow.innerHTML = "<p>Loading...</p>";
  upcomingRow.innerHTML = "<p>Loading...</p>";

  try {
    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split("T")[0];

    const [trendingRes, upcomingRes] = await Promise.all([
      fetch(`${BASE_URL}?key=${API_KEY}&ordering=-rating&page_size=12`),
      fetch(`${BASE_URL}?key=${API_KEY}&dates=${today},${nextYear}&ordering=-added&page_size=12`)
    ]);

    const trendingData = await trendingRes.json();
    const upcomingData = await upcomingRes.json();

    // 🔥 TRENDING
    trendingRow.innerHTML = "";
    trendingData.results.forEach(g => {
      if (!g.background_image) return;

      const item = document.createElement("div");
      item.className = "card";

      item.innerHTML = `
        <img src="${g.background_image}">
        <p>${g.name}</p>
      `;

      item.onclick = () => openModal(g.id);
      trendingRow.appendChild(item);
    });

    // 🚀 UPCOMING
    upcomingRow.innerHTML = "";

    if (!upcomingData.results.length) {
      upcomingRow.innerHTML = `<p style="color:#aaa;">No upcoming games found</p>`;
      return;
    }

    upcomingData.results.forEach(g => {
      if (!g.background_image) return;

      const item = document.createElement("div");
      item.className = "card";

      item.innerHTML = `
        <img src="${g.background_image}">
        <p>${g.name}</p>
      `;

      item.onclick = () => openModal(g.id);
      upcomingRow.appendChild(item);
    });

  } catch (err) {
    console.error(err);
    trendingRow.innerHTML = `<p style="color:#bbb;">Failed</p>`;
    upcomingRow.innerHTML = "";
  }
}
// ================= WATCHLIST + REVIEWS =================

function getWatchlist() {
  return JSON.parse(localStorage.getItem("watchlist") || "[]");
}

function setWatchlist(list) {
  localStorage.setItem("watchlist", JSON.stringify(list));
}

function getReviews() {
  return JSON.parse(localStorage.getItem("reviews") || "[]");
}

function setReviews(list) {
  localStorage.setItem("reviews", JSON.stringify(list));
}

function saveToWatchlist(game) {
  const list = getWatchlist();
  if (!list.find(g => g.id === game.id)) {
    list.push(game);
    setWatchlist(list);
    alert("Added to watchlist");
  }
}

function saveReview(game) {
  const text = document.getElementById("reviewText").value.trim();
  if (!text) return alert("Write something");

  const reviews = getReviews();
  reviews.push({ ...game, review: text });
  setReviews(reviews);

  alert("Review saved");
}

function renderWatchlistPage() {
  const grid = document.getElementById("watchlistGrid");
  if (!grid) return;

  const list = getWatchlist();
  grid.innerHTML = "";

  list.forEach(g => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<img src="${g.background_image}"><p>${g.name}</p>`;
    div.onclick = () => openModal(g.id);
    grid.appendChild(div);
  });
}

function renderReviewsPage() {
  const grid = document.getElementById("reviewsGrid");
  if (!grid) return;

  const list = getReviews();
  grid.innerHTML = "";

  list.forEach(g => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<img src="${g.background_image}">
      <p>${g.name}</p>
      <p>${g.review}</p>`;
    div.onclick = () => openModal(g.id);
    grid.appendChild(div);
  });
}

// 🎮 Modal (UPDATED ONLY UI)
async function openModal(id) {
  const modal = document.getElementById("gameModal");
  const body = document.getElementById("modalBody");

  modal.classList.remove("hidden");
  body.innerHTML = "<p>Loading...</p>";

  try {
    const res = await fetch(`${BASE_URL}/${id}?key=${API_KEY}`);
    const game = await res.json();

    body.innerHTML = `
      <img class="modal-hero" src="${game.background_image}">
      <h2>${game.name}</h2>
      <p><b>⭐ Rating:</b> ${game.rating}</p>
      <p>${game.description_raw || "No description"}</p>

      <button onclick='saveToWatchlist(${JSON.stringify(game)})'>Add to Watchlist</button>

      <div style="margin-top:10px;">
        <textarea id="reviewText" placeholder="Write review"></textarea>
        <button onclick='saveReview(${JSON.stringify(game)})'>Save Review</button>
      </div>
    `;

  } catch (err) {
    body.innerHTML = "<p>Error loading game</p>";
  }
}

// close modal
function closeModal() {
  document.getElementById("gameModal").classList.add("hidden");
}

// outside click close
window.addEventListener("click", function (e) {
  const modal = document.getElementById("gameModal");
  if (e.target === modal) closeModal();
});

// close dropdown
document.addEventListener("click", function(e) {
  const dropdown = document.getElementById("searchDropdown");
  const search = document.getElementById("search");

  if (!search.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add("hidden");
  }
});

// INIT
document.addEventListener("DOMContentLoaded", () => {
  loadGames(true);
  loadTrending();
  renderWatchlistPage();
  renderReviewsPage();
});

// ===== EXISTING FUNCTIONS (unchanged) =====
function goHome() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("explore").classList.add("active");

  document.querySelectorAll(".nav-links span").forEach(n => n.classList.remove("active"));
  document.querySelector(".nav-links span").classList.add("active");

  loadGames(true);

  const search = document.getElementById("search");
  if (search) search.value = "";

  document.getElementById("searchDropdown")?.classList.add("hidden");
}

function toggleAccountMenu() {
  const menu = document.getElementById("accountMenu");
  menu.classList.toggle("hidden");
}

function goProfile() {
  alert("Profile page coming soon");
}

document.addEventListener("click", function(e) {
  const menu = document.getElementById("accountMenu");

  if (!menu.contains(e.target) && !e.target.innerText.includes("Account")) {
    menu.classList.add("hidden");
  }
});
function openReviews() {
  // switch page
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("reviews").classList.add("active");

  // remove navbar highlight
  document.querySelectorAll(".nav-links span").forEach(n => n.classList.remove("active"));

  // close account menu
  document.getElementById("accountMenu").classList.add("hidden");

  // render reviews
  renderReviewsPage();
}
const trendingRow = document.getElementById("trendingRow");

if (trendingRow) {
  trendingRow.addEventListener("wheel", function (e) {
    // convert vertical scroll → horizontal
    if (e.deltaY !== 0) {
      e.preventDefault();
      trendingRow.scrollLeft += e.deltaY;
    }
  }, { passive: false });
}
document.addEventListener("DOMContentLoaded", () => {
  loadGames(true);
  loadTrending();

  const trendingRow = document.getElementById("trendingRow");

  if (trendingRow) {
    trendingRow.addEventListener("wheel", function (e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        trendingRow.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }
});
const rows = ["trendingRow", "upcomingRow"];

rows.forEach(id => {
  const row = document.getElementById(id);

  if (row) {
    row.addEventListener("wheel", function (e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        row.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }
});