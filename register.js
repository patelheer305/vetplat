import { api } from "./api.js";

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  try {
    const data = await api("/auth/register", "POST", { name, email, password, role });

    alert("Registration successful! Please login.");
    window.location.href = "login.html";
  } catch (err) {
    document.getElementById("registerError").innerText = "Error: " + err.message;
  }
});
