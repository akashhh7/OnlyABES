const AUTH_API_URL = "http://localhost:5000/api";
const authPage = document.body.dataset.authPage;
const form = document.querySelector(".auth-form");
const message = document.querySelector(".form-message");
const submitButton = document.querySelector(".auth-submit");

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `form-message ${type}`;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.querySelector("span").textContent = isLoading
    ? "Please wait..."
    : authPage === "signup" ? "Create account" : "Log in";
}

async function submitSignup(data) {
  if (data.password !== data.confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const response = await fetch(`${AUTH_API_URL}/auth/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    credentials: "include",
    body: JSON.stringify({
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password
    })
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "We couldn't create your account.");
  }

  window.location.href = "login.html?registered=1";
}

async function submitLogin(data) {
  const response = await fetch(`${AUTH_API_URL}/auth/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    credentials: "include",
    body: JSON.stringify({
      email: data.email.trim(),
      password: data.password
    })
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "We couldn't log you in.");
  }

  const meResponse = await fetch(`${AUTH_API_URL}/auth/me`, {
    credentials: "include"
  });
  const currentUser = await meResponse.json();

  const authenticatedUser = currentUser.user;
  if (
    !meResponse.ok ||
    !authenticatedUser ||
    !authenticatedUser.id ||
    !authenticatedUser.name ||
    !authenticatedUser.email
  ) {
    throw new Error("We couldn't confirm your login. Please try again.");
  }

  window.location.href = "index.html";
}

if (authPage === "login" && new URLSearchParams(window.location.search).has("registered")) {
  showMessage("Account created. Log in to start preserving your memories.", "success");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (authPage === "signup" && (!data.name.trim() || !data.email.trim() || !data.password || !data.confirmPassword)) {
    showMessage("Please complete every field.");
    return;
  }

  if (authPage === "login" && (!data.email.trim() || !data.password)) {
    showMessage("Please enter your email and password.");
    return;
  }

  setLoading(true);
  try {
    if (authPage === "signup") {
      await submitSignup(data);
    } else {
      await submitLogin(data);
    }
  } catch (error) {
    showMessage(error instanceof TypeError
      ? "The server is unavailable. Please try again."
      : error.message);
    setLoading(false);
  }
});
