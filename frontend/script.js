const memories = [
  {title:"Freshers' Day 2026", uploader:"Aarav Mehta", category:"College Events", date:"Sep 12, 2026", duration:"02:18", views:"1.2K", theme:"thumb-one"},
  {title:"The First Week at ABES", uploader:"Riya Sharma", category:"Campus Life", date:"Aug 28, 2026", duration:"04:42", views:"876", theme:"thumb-two"},
  {title:"College Fest Highlights", uploader:"Dev & The Crew", category:"Festivals", date:"Oct 04, 2026", duration:"06:15", views:"2.4K", theme:"thumb-three"},
  {title:"Hostel Chronicles", uploader:"Room 304", category:"Hostel Life", date:"Sep 30, 2026", duration:"03:07", views:"643", theme:"thumb-four"},
  {title:"Random Moments With The Squad", uploader:"Ishita Kapoor", category:"Friends", date:"Sep 19, 2026", duration:"01:56", views:"1.1K", theme:"thumb-five"},
  {title:"Farewell Memories", uploader:"Batch of '26", category:"Milestones", date:"May 22, 2026", duration:"08:30", views:"3.8K", theme:"thumb-six"}
];

const categories = [
  {name:"College Events", icon:"✦"}, {name:"Festivals", icon:"✺"}, {name:"Sports", icon:"◒"}, {name:"Cultural", icon:"◈"},
  {name:"Friends", icon:"∞"}, {name:"Hostel Life", icon:"⌂"}, {name:"Trips", icon:"↗"}, {name:"Random Memories", icon:"✳"}
];

const memoryGrid = document.querySelector("#memory-grid");
const categoryGrid = document.querySelector("#category-grid");
const toast = document.querySelector(".toast");
const serverStatus = document.querySelector("#server-status");
const statusText = serverStatus.querySelector(".status-text");
const authApiUrl = "http://localhost:5000/api";
const guestActions = document.querySelectorAll(".guest-actions");
const userActions = document.querySelectorAll(".user-actions");
const userNames = document.querySelectorAll("[data-user-name]");
const logoutButtons = document.querySelectorAll("[data-logout]");

function setNavbarAuthState(user) {
  const isAuthenticated = Boolean(user);

  guestActions.forEach((element) => {
    element.hidden = isAuthenticated;
  });
  userActions.forEach((element) => {
    element.hidden = !isAuthenticated;
  });
  userNames.forEach((element) => {
    element.textContent = isAuthenticated ? user.name : "";
  });
}

async function checkAuthenticatedUser() {
  try {
    const response = await fetch(`${authApiUrl}/auth/me`, {
      credentials: "include"
    });

    if (response.status === 401) {
      setNavbarAuthState(null);
      return;
    }

    if (!response.ok) {
      throw new Error("Unable to check authentication.");
    }

    const result = await response.json();
    if (!result.user || !result.user.id || !result.user.name || !result.user.email) {
      throw new Error("The authentication response was incomplete.");
    }

    setNavbarAuthState(result.user);
  } catch (error) {
    setNavbarAuthState(null);
    console.error("Authentication check failed:", error);
  }
}

async function logoutUser() {
  logoutButtons.forEach((button) => {
    button.disabled = true;
  });

  try {
    const response = await fetch(`${authApiUrl}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Logout request failed.");
    }

    setNavbarAuthState(null);
  } catch (error) {
    console.error("Logout failed:", error);
    showToast("We couldn't log you out. Please try again.");
  } finally {
    logoutButtons.forEach((button) => {
      button.disabled = false;
    });
  }
}

async function checkServerStatus() {
  try {
    const response = await fetch("http://localhost:5000/api/health");
    const health = await response.json();

    if (!response.ok || health.status !== "OK") {
      throw new Error("The health check returned an unhealthy response.");
    }

    serverStatus.classList.add("online");
    statusText.textContent = "Backend online";
  } catch (error) {
    serverStatus.classList.add("offline");
    statusText.textContent = "Backend offline";
  }
}

function renderMemories(items) {
  memoryGrid.innerHTML = items.map((memory, index) => `
    <article class="memory-card reveal" style="transition-delay:${index * 60}ms">
      <div class="thumbnail ${memory.theme}">
        <span class="thumb-label">${memory.category}</span>
        <span class="duration">${memory.duration}</span>
        <button class="play-button card-play" type="button" data-play="${memory.title}" aria-label="Play ${memory.title}"><span aria-hidden="true">▶</span></button>
      </div>
      <h3>${memory.title}</h3>
      <div class="card-meta"><span>${memory.uploader}</span><span>${memory.date} · ${memory.views} views</span></div>
    </article>
  `).join("");
}

function renderCategories() {
  categoryGrid.innerHTML = categories.map((category, index) => `
    <a class="category-card reveal" style="transition-delay:${index * 45}ms" href="#memories" data-category="${category.name}">
      <span class="category-number">0${index + 1}</span><span class="category-icon" aria-hidden="true">${category.icon}</span><h3>${category.name}</h3>
    </a>
  `).join("");
}

renderMemories(memories);
renderCategories();
checkServerStatus();
checkAuthenticatedUser();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, {threshold:0.12});
document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

const header = document.querySelector(".site-header");
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 20), {passive:true});

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#mobile-menu");
menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
});
navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
}));

const searchPanel = document.querySelector("#search-panel");
const searchInput = document.querySelector("#search-input");
document.querySelector(".search-trigger").addEventListener("click", () => {
  const isOpen = searchPanel.classList.toggle("open");
  searchPanel.setAttribute("aria-hidden", String(!isOpen));
  if (isOpen) searchInput.focus();
});
document.querySelector(".search-close").addEventListener("click", () => {
  searchPanel.classList.remove("open");
  searchPanel.setAttribute("aria-hidden", "true");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && searchPanel.classList.contains("open")) {
    searchPanel.classList.remove("open");
    searchPanel.setAttribute("aria-hidden", "true");
  }
});

function showToast(message) {
  toast.textContent = `${message} — video playback will be connected soon.`;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
}
document.addEventListener("click", (event) => {
  const playButton = event.target.closest("[data-play]");
  if (playButton) showToast(playButton.dataset.play);

  if (event.target.closest("[data-logout]")) {
    logoutUser();
  }
});

searchInput.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  const filtered = memories.filter((memory) => Object.values(memory).some((value) => String(value).toLowerCase().includes(query)));
  renderMemories(filtered);
  document.querySelectorAll("#memory-grid .reveal").forEach((element) => { observer.observe(element); });
});
