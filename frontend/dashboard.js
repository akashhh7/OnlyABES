const DASHBOARD_API_URL = "http://localhost:5000/api";
const userNameHeading = document.querySelector("#user-name-heading");
const userName = document.querySelector("#user-name");
const userEmail = document.querySelector("#user-email");
const createdAt = document.querySelector("#created-at");
const profileInitials = document.querySelector("#profile-initials");
const logoutButton = document.querySelector("#logout-button");
const uploadButtons = document.querySelectorAll("[data-upload], #upload-button");
const toast = document.querySelector(".toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function formatMemberDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric"
  }).format(date);
}

function setUserDetails(user) {
  const firstName = user.name.trim().split(/\s+/)[0];
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  userNameHeading.textContent = `${firstName}.`;
  userName.textContent = user.name;
  userEmail.textContent = user.email;
  createdAt.textContent = formatMemberDate(user.created_at);
  profileInitials.textContent = initials || "O";
}

async function loadAuthenticatedUser() {
  try {
    const response = await fetch(`${DASHBOARD_API_URL}/auth/me`, {
      credentials: "include"
    });

    if (response.status === 401) {
      window.location.replace("login.html");
      return;
    }

    if (!response.ok) {
      throw new Error("Unable to load your account.");
    }

    const result = await response.json();
    if (!result.user || !result.user.id || !result.user.name || !result.user.email) {
      throw new Error("The account response was incomplete.");
    }

    setUserDetails(result.user);
  } catch (error) {
    console.error("Dashboard authentication check failed:", error);
    showToast("We couldn't load your account. Please try again.");
  }
}

async function logout() {
  logoutButton.disabled = true;

  try {
    const response = await fetch(`${DASHBOARD_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Logout request failed.");
    }

    window.location.replace("login.html");
  } catch (error) {
    console.error("Dashboard logout failed:", error);
    showToast("We couldn't log you out. Please try again.");
    logoutButton.disabled = false;
  }
}

logoutButton.addEventListener("click", logout);
uploadButtons.forEach((button) => {
  button.addEventListener("click", () => showToast("Memory uploads are coming soon."));
});

loadAuthenticatedUser();
