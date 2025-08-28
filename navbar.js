// navbar.js
import { API_BASE } from "./config.js";

function renderNavbar() {
  const navAuth = document.getElementById("nav-auth");
  const user = JSON.parse(localStorage.getItem("user"));

  if (user) {
    navAuth.innerHTML = `
      <div class="user-menu">
        <span>${user.name} ⌄</span>
        <div class="dropdown">
          <a href="dashboard.html">Dashboard</a>
          <a href="#" id="logoutBtn">Sign Out</a>
        </div>
      </div>
    `;

    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
    });
  } else {
    navAuth.innerHTML = `<a href="login.html">Log In / Register</a>`;
  }
}

renderNavbar();
