// ================== CONFIG ==================
const API_BASE = "https://your-backend.onrender.com/api"; // update with your Render backend URL

// ================== NAVBAR HANDLING ==================
function updateNavbar() {
  const navAuth = document.getElementById("nav-auth");
  const logoutBtn = document.getElementById("logoutBtn");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (navAuth) {
    if (token) {
      navAuth.textContent = "Dashboard";
      navAuth.href = "dashboard.html";
    } else {
      navAuth.textContent = "Log In / Register";
      navAuth.href = "login.html";
    }
  }

  if (logoutBtn) {
    if (token) {
      logoutBtn.style.display = "inline";
      logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location = "index.html";
      });
    } else {
      logoutBtn.style.display = "none";
    }
  }
}
updateNavbar();

// ================== INDEX PAGE (doctor list + book) ==================
async function loadDoctors() {
  if (!document.getElementById("doctors")) return;

  const res = await fetch(`${API_BASE}/doctors`);
  const doctors = await res.json();

  renderDoctors(doctors);

  document.getElementById("searchBtn").addEventListener("click", () => {
    const spec = document.getElementById("filter-specialization").value.toLowerCase();
    const loc = document.getElementById("filter-location").value.toLowerCase();
    const filtered = doctors.filter(
      d =>
        (!spec || (d.specialization || "").toLowerCase().includes(spec)) &&
        (!loc || (d.location || "").toLowerCase().includes(loc))
    );
    renderDoctors(filtered);
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    document.getElementById("filter-specialization").value = "";
    document.getElementById("filter-location").value = "";
    renderDoctors(doctors);
  });
}

function renderDoctors(doctors) {
  const container = document.getElementById("doctors");
  container.innerHTML = "";
  if (!doctors.length) {
    container.innerHTML = "<p>No doctors found.</p>";
    return;
  }

  doctors.forEach(d => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${d.name}</h3>
      <p><b>Specialization:</b> ${d.specialization || "N/A"}</p>
      <p><b>Location:</b> ${d.location || "N/A"}</p>
      <p><b>Teleconsult Fee:</b> ₹${d.feesTeleconsult || "-"}</p>
      <p><b>Visit Fee:</b> ₹${d.feesVisit || "-"}</p>
      <button class="bookBtn" data-id="${d._id}">Book</button>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll(".bookBtn").forEach(btn => {
    btn.addEventListener("click", e => {
      const doctorId = e.target.dataset.id;
      localStorage.setItem("selectedDoctorId", doctorId);
      window.location = "book.html";
    });
  });
}
loadDoctors();

// ================== LOGIN PAGE ==================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);
      window.location = "dashboard.html";
    } else {
      document.getElementById("error").textContent = data.message || "Login failed";
    }
  });
}

// ================== REGISTER PAGE ==================
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  const roleSelect = document.getElementById("role");
  const doctorExtra = document.getElementById("doctorExtra");

  roleSelect.addEventListener("change", () => {
    doctorExtra.style.display = roleSelect.value === "Doctor" ? "block" : "none";
  });

  registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      village: document.getElementById("village").value,
      tehsil: document.getElementById("tehsil").value,
      district: document.getElementById("district").value,
      state: document.getElementById("state").value,
      mobile: document.getElementById("mobile").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
      role: roleSelect.value
    };

    if (roleSelect.value === "Doctor") {
      payload.specialization = document.getElementById("specialization").value;
      payload.feesTeleconsult = document.getElementById("feesTeleconsult").value;
      payload.feesVisit = document.getElementById("feesVisit").value;
    }

    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      alert("Registration successful! Please log in.");
      window.location = "login.html";
    } else {
      alert(data.message || "Registration failed");
    }
  });
}

// ================== DASHBOARD PAGE ==================
async function initDashboard() {
  if (!document.getElementById("appointments")) return;

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");

  if (!token) return (window.location = "login.html");

  // show user info
  document.getElementById("userInfo").innerHTML = `
    <p><b>Name:</b> ${name}</p>
    <p><b>Role:</b> ${role}</p>
  `;

  // fetch appointments
  const res = await fetch(`${API_BASE}/appointments`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const appts = await res.json();
  const container = document.getElementById("appointments");
  container.innerHTML = "";

  if (!appts.length) {
    container.innerHTML = "<p>No appointments found.</p>";
    return;
  }

  appts.forEach(a => {
    const card = document.createElement("div");
    card.className = "card";

    if (role === "Farmer") {
      card.innerHTML = `
        <p><b>Doctor:</b> ${a.doctor?.name || "N/A"} (${a.doctor?.specialization || ""})</p>
        <p><b>Date:</b> ${a.date}</p>
        <p><b>Time:</b> ${a.time}</p>
        <p><b>Status:</b> ${a.status}</p>
      `;
    } else if (role === "Doctor") {
      card.innerHTML = `
        <p><b>Farmer:</b> ${a.farmer?.firstName || ""} ${a.farmer?.lastName || ""}</p>
        <p><b>Mobile:</b> ${a.farmer?.mobile || ""}</p>
        <p><b>Date:</b> ${a.date}</p>
        <p><b>Time:</b> ${a.time}</p>
        <p><b>Status:</b> ${a.status}</p>
      `;
    }

    container.appendChild(card);
  });
}
initDashboard();
