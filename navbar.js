const navUser = document.getElementById("navUser");
const user = JSON.parse(localStorage.getItem("user"));

if (user) {
  navUser.innerHTML = `
    <div class="dropdown">
      <span>${user.name}</span>
      <div class="dropdown-content">
        <a href="${user.role === "doctor" ? "dashboard.html" : user.role === "farmer" ? "book.html" : "admin.html"}">Dashboard</a>
        <a href="#" id="logoutBtn">Sign Out</a>
      </div>
    </div>
  `;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });
} else {
  navUser.innerHTML = `<a href="login.html">Login</a>`;
}
