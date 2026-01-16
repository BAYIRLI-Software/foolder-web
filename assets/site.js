const appUrl = "/app/index.html"; // Hosted desktop web build
const defaultBackendUrl = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:3000"
  : "https://api.foolder.com";
const backendBaseUrl = window.FOOLDER_BACKEND_URL
  || localStorage.getItem("foolder_backend_url")
  || defaultBackendUrl;

const tokenKey = "foolder_token";
const statusEl = document.getElementById("loginStatus");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

async function api(path, options = {}) {
  const token = localStorage.getItem(tokenKey);
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${backendBaseUrl}${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function refreshAuthStatus() {
  try {
    const data = await api("/me");
    if (statusEl) statusEl.textContent = `Logged in as ${data.user?.username || "user"}`;
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } catch {
    if (statusEl) statusEl.textContent = "Not logged in.";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

const frame = document.getElementById("appFrame");
if (frame) {
  frame.src = appUrl;
}

const path = window.location.pathname.toLowerCase();
document.querySelectorAll(".nav a").forEach(link => {
  const href = link.getAttribute("href") || "";
  if (path.endsWith(href)) {
    link.classList.add("active");
  }
});

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      const username = document.getElementById("loginUser").value.trim();
      const password = document.getElementById("loginPass").value;
      if (!username || !password) {
        if (statusEl) statusEl.textContent = "Please enter username and password.";
        return;
      }
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      if (data.token) localStorage.setItem(tokenKey, data.token);
      await refreshAuthStatus();
    } catch (e) {
      if (statusEl) statusEl.textContent = `Login failed: ${e.message}`;
    }
  });
}

if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    try {
      const username = document.getElementById("registerUser").value.trim();
      const password = document.getElementById("registerPass").value;
      if (!username || !password) {
        if (statusEl) statusEl.textContent = "Please enter username and password.";
        return;
      }
      await api("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) });
      if (statusEl) statusEl.textContent = "Account created. You can log in now.";
    } catch (e) {
      if (statusEl) statusEl.textContent = `Register failed: ${e.message}`;
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    api("/auth/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => {
        localStorage.removeItem(tokenKey);
        refreshAuthStatus();
      });
  });
}

refreshAuthStatus();
