import { api } from "./api.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const data = await api("/auth/login", "POST", { email, password });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (data.user.role === "doctor") {
      window.location.href = "dashboard.html"; // doctor dashboard
    } else if (data.user.role === "farmer") {
      window.location.href = "book.html"; // farmer dashboard
    } else if (data.user.role === "admin") {
      window.location.href = "admin.html";
    }
  } catch (err) {
    document.getElementById("loginError").innerText = "Login failed: " + err.message;
  }
});
